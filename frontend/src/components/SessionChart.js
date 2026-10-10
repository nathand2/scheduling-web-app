import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import SessionSelectRangeModal from "./SessionSelectRangeModal";
import "../styles//SessionChart.css";

const SNAP_MINUTES = 15; // Drag snaps to this increment
const DRAG_THRESHOLD_PX = 5; // Movement below this counts as a click, not a drag
const MIN_BLOCK_PX = 18; // Keeps very short ranges visible/clickable
const TARGET_BODY_PX = 520; // Aim for roughly this chart height; hour height adapts
const MIN_HOUR_PX = 44;
const MAX_HOUR_PX = 80;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const snap = (m) => Math.round(m / SNAP_MINUTES) * SNAP_MINUTES;
const fmtMinute = (day, m) => day.add(m, "minute").format("h:mm A");

/**
 * Collaborative availability chart.
 *
 * Layout: shared vertical time axis (left), one column per calendar day.
 * Overlapping ranges inside a day are packed into side-by-side lanes.
 * Drag on a column to propose a new range; click an existing block for details.
 *
 * Props:
 *  - timeRanges: [{ id, user_id, display_name, status, dt_start, dt_end }]
 *  - session:    { dt_start, dt_end, ... } (Date objects)
 *  - userId:     current user's id
 *  - onCreateRange({ start: Date, end: Date }): called when a drag completes
 *  - readOnly:   disables drag-to-create (e.g. expired session)
 */
const SessionChart = ({ timeRanges, session, userId, onCreateRange, readOnly }) => {
  const [showSelectRangeModal, setShowSelectRangeModal] = useState(false);
  const [focusRange, setFocusRange] = useState(undefined);
  const [drag, setDrag] = useState(null); // { dayIdx, anchor, current } (minutes from day start)
  const [hover, setHover] = useState(null); // { dayIdx, minute }
  const [drawMode, setDrawMode] = useState(false); // Touch devices: opt in so scrolling still works
  const [now, setNow] = useState(() => dayjs());
  const downInfo = useRef(null); // { startY, rangeId } for the active pointer

  // Current-time line ticks once a minute; interval is cleaned up on unmount
  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Escape cancels an in-progress drag
  useEffect(() => {
    if (!drag) return;
    const onKey = (e) => {
      if (e.key === "Escape") setDrag(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drag]);

  /**
   * Geometry: which days exist, what hours the shared axis covers,
   * and how many pixels one minute is.
   */
  const layout = useMemo(() => {
    if (!session?.dt_start || !session?.dt_end) return null;

    const start = dayjs(session.dt_start);
    const end = dayjs(session.dt_end);
    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return null;

    const days = [];
    let cursor = start.startOf("day");
    while (cursor.isBefore(end)) {
      const dayStart = cursor;
      const dayEnd = cursor.add(1, "day");
      const winStart = start.isAfter(dayStart) ? start : dayStart;
      const winEnd = end.isBefore(dayEnd) ? end : dayEnd;
      days.push({
        key: dayStart.format("YYYY-MM-DD"),
        date: dayStart,
        end: dayEnd,
        winStartMin: winStart.diff(dayStart, "minute"),
        winEndMin: winEnd.diff(dayStart, "minute"),
      });
      cursor = dayEnd;
    }

    // Shared axis covers the union of every day's usable window, rounded to hours
    const axisStart =
      Math.floor(Math.min(...days.map((d) => d.winStartMin)) / 60) * 60;
    const axisEnd = Math.ceil(Math.max(...days.map((d) => d.winEndMin)) / 60) * 60;
    const hours = Math.max((axisEnd - axisStart) / 60, 1);
    const hourPx = clamp(Math.round(TARGET_BODY_PX / hours), MIN_HOUR_PX, MAX_HOUR_PX);
    const pxPerMin = hourPx / 60;

    return {
      days,
      axisStart,
      axisEnd,
      hourPx,
      pxPerMin,
      bodyHeight: (axisEnd - axisStart) * pxPerMin,
      hourLabels: Array.from({ length: hours }, (_, i) => axisStart + i * 60),
    };
  }, [session]);

  /**
   * Slice every range into per-day segments (a range crossing midnight shows in
   * both columns), then pack overlapping segments in a day into lanes.
   */
  const segmentsByDay = useMemo(() => {
    if (!layout) return [];

    return layout.days.map((day) => {
      const segs = [];
      (timeRanges || []).forEach((range) => {
        const rs = dayjs(range.dt_start);
        const re = dayjs(range.dt_end);
        if (!re.isAfter(day.date) || !rs.isBefore(day.end)) return;

        const segStart = rs.isAfter(day.date) ? rs : day.date;
        const segEnd = re.isBefore(day.end) ? re : day.end;
        segs.push({
          range,
          startMin: segStart.diff(day.date, "minute"),
          endMin: segEnd.diff(day.date, "minute"),
          continuesBefore: rs.isBefore(day.date),
          continuesAfter: re.isAfter(day.end),
          lane: 0,
        });
      });

      // Greedy lane packing: first lane whose last block has already ended
      segs.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
      const laneEnds = [];
      segs.forEach((seg) => {
        let lane = laneEnds.findIndex((endMin) => endMin <= seg.startMin);
        if (lane === -1) {
          lane = laneEnds.length;
          laneEnds.push(0);
        }
        laneEnds[lane] = seg.endMin;
        seg.lane = lane;
      });

      return { segs, laneCount: Math.max(laneEnds.length, 1) };
    });
  }, [layout, timeRanges]);

  if (!layout) {
    return <div className="sc-empty">Loading chart…</div>;
  }

  const { days, axisStart, hourPx, pxPerMin, bodyHeight, hourLabels } = layout;
  const canDraw = !readOnly;
  const yOf = (minute) => (minute - axisStart) * pxPerMin;
  const isMine = (range) => String(range.user_id) === String(userId);
  const hasRanges = (timeRanges || []).length > 0;

  const minuteFromPointer = (e, dayIdx) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const raw = axisStart + (e.clientY - rect.top) / pxPerMin;
    const day = days[dayIdx];
    return clamp(snap(raw), day.winStartMin, day.winEndMin);
  };

  const handlePointerDown = (e, dayIdx) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Not drawing (read-only, or touch without draw mode): taps on a block still open it
    if (!canDraw || (e.pointerType === "touch" && !drawMode)) {
      const blockEl = e.target.closest("[data-range-id]");
      downInfo.current = blockEl
        ? { startY: e.clientY, rangeId: blockEl.dataset.rangeId }
        : null;
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const blockEl = e.target.closest("[data-range-id]");
    downInfo.current = {
      startY: e.clientY,
      rangeId: blockEl ? blockEl.dataset.rangeId : null,
    };
    const m = minuteFromPointer(e, dayIdx);
    setDrag({ dayIdx, anchor: m, current: m });
  };

  const handlePointerMove = (e, dayIdx) => {
    const m = minuteFromPointer(e, dayIdx);
    if (e.pointerType === "mouse") setHover({ dayIdx, minute: m });
    if (drag && drag.dayIdx === dayIdx) {
      setDrag((d) => (d ? { ...d, current: m } : d));
    }
  };

  const handlePointerUp = (e, dayIdx) => {
    const info = downInfo.current;
    downInfo.current = null;

    if (!drag || drag.dayIdx !== dayIdx) {
      // Drawing disabled: a click on a block still opens its details
      if (info?.rangeId && Math.abs(e.clientY - info.startY) <= DRAG_THRESHOLD_PX) {
        openRangeById(info.rangeId);
      }
      return;
    }

    const moved = info ? Math.abs(e.clientY - info.startY) > DRAG_THRESHOLD_PX : true;
    const end = minuteFromPointer(e, dayIdx);
    const lo = Math.min(drag.anchor, end);
    const hi = Math.max(drag.anchor, end);
    setDrag(null);

    if (!moved) {
      // Treated as a click: open the block under the pointer, if any
      if (info?.rangeId) openRangeById(info.rangeId);
      return;
    }

    if (hi - lo >= SNAP_MINUTES && onCreateRange) {
      const day = days[dayIdx].date;
      onCreateRange({
        start: day.add(lo, "minute").toDate(),
        end: day.add(hi, "minute").toDate(),
      });
    }
  };

  const openRangeById = (id) => {
    const range = (timeRanges || []).find((r) => String(r.id) === String(id));
    if (range) {
      setFocusRange(range);
      setShowSelectRangeModal(true);
    }
  };

  const nowDayIdx = days.findIndex(
    (d) => !now.isBefore(d.date) && now.isBefore(d.end)
  );
  const nowMinute = nowDayIdx >= 0 ? now.diff(days[nowDayIdx].date, "minute") : null;

  return (
    <div className={`sc-wrap ${drawMode ? "sc-draw" : ""}`}>
      <SessionSelectRangeModal
        show={showSelectRangeModal}
        handleClose={() => setShowSelectRangeModal(false)}
        range={focusRange}
        session={session}
        userId={userId}
      />

      <div className="sc-toolbar">
        <div className="sc-legend">
          <span className="sc-legend-item">
            <i className="sc-swatch sc-going" /> Going
          </span>
          <span className="sc-legend-item">
            <i className="sc-swatch sc-maybe" /> Maybe
          </span>
          <span className="sc-legend-item">
            <i className="sc-swatch sc-mine" /> You
          </span>
        </div>

        {canDraw && (
          <div className="sc-toolbar-right">
            <span className="sc-hint">
              {drawMode ? "Draw mode: drag to add" : "Drag on the chart to add your availability"}
            </span>
            <button
              type="button"
              className={`sc-draw-toggle ${drawMode ? "active" : ""}`}
              onClick={() => setDrawMode((v) => !v)}
              aria-pressed={drawMode}
              title="On touch screens, turn this on to drag without scrolling"
            >
              ✎ Draw
            </button>
          </div>
        )}
      </div>

      <div className="sc-scroll">
        <div
          className="sc-grid"
          style={{
            gridTemplateColumns: `56px repeat(${days.length}, minmax(${
              days.length > 3 ? 104 : 140
            }px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="sc-corner" />
          {days.map((d, i) => (
            <div
              key={d.key}
              className={`sc-day-head ${i === nowDayIdx ? "is-today" : ""}`}
            >
              <span className="sc-day-name">{d.date.format("ddd")}</span>
              <span className="sc-day-date">{d.date.format("MMM D")}</span>
            </div>
          ))}

          {/* Body row: time axis, then one column per day */}
          <div className="sc-axis" style={{ height: bodyHeight }}>
            {hourLabels.map((m, i) => (
              <span key={m} className="sc-axis-label" style={{ top: i * hourPx }}>
                {fmtMinute(dayjs().startOf("day"), m)}
              </span>
            ))}
          </div>

          {days.map((day, dayIdx) => {
            const { segs, laneCount } = segmentsByDay[dayIdx];
            const dragHere = drag && drag.dayIdx === dayIdx;
            const dragLo = dragHere ? Math.min(drag.anchor, drag.current) : 0;
            const dragHi = dragHere ? Math.max(drag.anchor, drag.current) : 0;

            return (
              <div
                key={day.key}
                className={`sc-col ${canDraw ? "can-draw" : ""}`}
                style={{
                  height: bodyHeight,
                  backgroundSize: `100% ${hourPx}px`,
                }}
                onPointerDown={(e) => handlePointerDown(e, dayIdx)}
                onPointerMove={(e) => handlePointerMove(e, dayIdx)}
                onPointerUp={(e) => handlePointerUp(e, dayIdx)}
                onPointerCancel={() => {
                  downInfo.current = null;
                  setDrag(null);
                }}
                onPointerLeave={() => setHover(null)}
              >
                {/* Outside the session window: shaded and not selectable */}
                {day.winStartMin > axisStart && (
                  <div
                    className="sc-out"
                    style={{ top: 0, height: yOf(day.winStartMin) }}
                  />
                )}
                {day.winEndMin < layout.axisEnd && (
                  <div
                    className="sc-out"
                    style={{ top: yOf(day.winEndMin), bottom: 0 }}
                  />
                )}

                {/* Availability blocks */}
                {segs.map((seg) => {
                  const { range } = seg;
                  const height = Math.max(
                    (seg.endMin - seg.startMin) * pxPerMin,
                    MIN_BLOCK_PX
                  );
                  const widthPct = 100 / laneCount;
                  const label = isMine(range)
                    ? `${range.display_name} (you)`
                    : range.display_name;
                  const timeText = `${fmtMinute(day.date, seg.startMin)} – ${fmtMinute(
                    day.date,
                    seg.endMin
                  )}`;
                  return (
                    <div
                      key={`${range.id}-${day.key}`}
                      data-range-id={range.id}
                      className={[
                        "sc-block",
                        range.status === "maybe" ? "sc-maybe" : "sc-going",
                        isMine(range) ? "sc-mine" : "",
                        seg.continuesBefore ? "cont-before" : "",
                        seg.continuesAfter ? "cont-after" : "",
                      ].join(" ")}
                      style={{
                        top: yOf(seg.startMin),
                        height,
                        left: `calc(${seg.lane * widthPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                      }}
                      title={`${label}: ${range.status}\n${timeText}`}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openRangeById(range.id);
                        }
                      }}
                    >
                      <span className="sc-block-name">{label}</span>
                      {height >= 40 && <span className="sc-block-time">{timeText}</span>}
                    </div>
                  );
                })}

                {/* Live drag preview */}
                {dragHere && dragHi > dragLo && (
                  <div
                    className="sc-preview"
                    style={{ top: yOf(dragLo), height: (dragHi - dragLo) * pxPerMin }}
                  >
                    <span>
                      {fmtMinute(day.date, dragLo)} – {fmtMinute(day.date, dragHi)}
                    </span>
                  </div>
                )}

                {/* Hover guide (mouse only) */}
                {hover && hover.dayIdx === dayIdx && !drag && canDraw && (
                  <div className="sc-hover" style={{ top: yOf(hover.minute) }}>
                    <span>{fmtMinute(day.date, hover.minute)}</span>
                  </div>
                )}

                {/* Current time */}
                {nowDayIdx === dayIdx &&
                  nowMinute >= day.winStartMin &&
                  nowMinute <= day.winEndMin && (
                    <div className="sc-now" style={{ top: yOf(nowMinute) }} />
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {!hasRanges && (
        <p className="sc-empty-hint">
          Nobody has added availability yet. Drag on the chart to be the first.
        </p>
      )}
    </div>
  );
};

export default SessionChart;