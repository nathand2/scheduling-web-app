import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import SessionSelectRangeModal from "./SessionSelectRangeModal";
import "../styles/SessionChart.css";
import "../styles/SessionChartHeat.css";

const SNAP_MINUTES = 15; // Drag snaps to this increment
const DRAG_THRESHOLD_PX = 5; // Movement below this counts as a click, not a drag
const MIN_BLOCK_PX = 18; // Keeps very short ranges visible/clickable
const TARGET_BODY_PX = 520; // Aim for roughly this chart height; hour height adapts
const MIN_HOUR_PX = 44;
const MAX_HOUR_PX = 80;
const HEAT_SLOT_MINUTES = 30; // Overlap is computed per slot of this size
const HEAT_STRIP_PX = 28; // Width of the overlap strip on the left of each day column
const MAX_BEST_CHIPS = 4; // Best-time windows shown in the bar

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const snap = (m) => Math.round(m / SNAP_MINUTES) * SNAP_MINUTES;
const fmtMinute = (day, m) => day.add(m, "minute").format("h:mm A");
const userKey = (range) => String(range.user_id ?? `range-${range.id}`);

// Turn the session window into a shared time axis and one usable window per day.
const buildChartLayout = (session) => {
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

  const axisStart = Math.floor(Math.min(...days.map((day) => day.winStartMin)) / 60) * 60;
  const axisEnd = Math.ceil(Math.max(...days.map((day) => day.winEndMin)) / 60) * 60;
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
    hourLabels: Array.from({ length: hours }, (_, index) => axisStart + index * 60),
  };
};

// Split ranges at midnight and assign stable user columns and conflict lanes.
const buildSegmentsByDay = (layout, timeRanges) => {
  if (!layout) return [];

  return layout.days.map((day) => {
    const segs = [];
    (timeRanges || []).forEach((range) => {
      const rangeStart = dayjs(range.dt_start);
      const rangeEnd = dayjs(range.dt_end);
      if (!rangeEnd.isAfter(day.date) || !rangeStart.isBefore(day.end)) return;

      const segStart = rangeStart.isAfter(day.date) ? rangeStart : day.date;
      const segEnd = rangeEnd.isBefore(day.end) ? rangeEnd : day.end;
      segs.push({
        range,
        startMin: segStart.diff(day.date, "minute"),
        endMin: segEnd.diff(day.date, "minute"),
        continuesBefore: rangeStart.isBefore(day.date),
        continuesAfter: rangeEnd.isAfter(day.end),
        lane: 0,
      });
    });

    const users = Array.from(new Map<string, { key: string; name: string }>(
      (timeRanges || []).map((range) => [userKey(range), {
        key: userKey(range),
        name: range.display_name || "Unknown user",
      }] as [string, { key: string; name: string }])
    ).values()).sort((a, b) => a.name.localeCompare(b.name) || a.key.localeCompare(b.key));
    const userIndex = new Map(users.map((user, index) => [user.key, index]));

    segs.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
    const laneEndsByUser = new Map();
    segs.forEach((seg) => {
      const key = userKey(seg.range);
      const laneEnds = laneEndsByUser.get(key) || [];
      laneEndsByUser.set(key, laneEnds);
      let lane = laneEnds.findIndex((endMin) => endMin <= seg.startMin);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(seg.startMin);
      }
      laneEnds[lane] = seg.endMin;
      seg.lane = lane;
      seg.userIndex = userIndex.get(key);
    });

    segs.forEach((seg) => {
      const key = userKey(seg.range);
      seg.userLaneCount = laneEndsByUser.get(key).length;
      seg.hasConflict = segs.some((other) =>
        other !== seg && userKey(other.range) === key &&
        seg.startMin < other.endMin && seg.endMin > other.startMin
      );
    });

    return { segs, users, userCount: Math.max(users.length, 1) };
  });
};

// Count people available for each half-hour slot and find peak-overlap windows.
const buildOverlapHeat = (layout, segmentsByDay, timeRanges, includeMaybe) => {
  if (!layout) return { byDay: [], best: [], peak: 0, participants: 0 };

  const participants = new Set((timeRanges || []).map(userKey)).size;
  const byDay = layout.days.map((day, dayIdx) => {
    const { segs } = segmentsByDay[dayIdx];
    const slots = [];

    for (let startMin = day.winStartMin; startMin < day.winEndMin; startMin += HEAT_SLOT_MINUTES) {
      const endMin = Math.min(startMin + HEAT_SLOT_MINUTES, day.winEndMin);
      const people = new Map();
      segs.forEach((seg) => {
        if (seg.startMin <= startMin && seg.endMin >= endMin) {
          const key = userKey(seg.range);
          const status = seg.range.status === "maybe" ? "maybe" : "going";
          const previous = people.get(key);
          if (!previous || (previous.status === "maybe" && status === "going")) {
            people.set(key, { name: seg.range.display_name, status });
          }
        }
      });

      const going = [...people.values()].filter((person) => person.status === "going").map((person) => person.name);
      const maybe = [...people.values()].filter((person) => person.status === "maybe").map((person) => person.name);
      slots.push({ startMin, endMin, going, maybe, score: going.length + (includeMaybe ? maybe.length : 0) });
    }
    return { slots };
  });

  const peak = Math.max(0, ...byDay.flatMap((day) => day.slots.map((slot) => slot.score)));
  const best = [];
  if (peak >= 2) {
    byDay.forEach((day, dayIdx) => {
      let run = null;
      day.slots.forEach((slot) => {
        if (slot.score !== peak) run = null;
        else if (run && run.endMin === slot.startMin) run.endMin = slot.endMin;
        else {
          run = { dayIdx, startMin: slot.startMin, endMin: slot.endMin };
          best.push(run);
        }
      });
    });
    best.sort((a, b) =>
      b.endMin - b.startMin - (a.endMin - a.startMin) || a.dayIdx - b.dayIdx || a.startMin - b.startMin
    );
  }

  return { byDay, best, peak, participants };
};

/**
 * Collaborative availability chart.
 *
 * Layout: shared vertical time axis (left), one column per calendar day.
 * Each column has a narrow overlap strip (how many people are free per
 * half hour) and, to its right, the individual ranges packed into lanes.
 * Drag on a column to propose a new range; click an existing block for details.
 *
 * Props:
 *  - timeRanges: [{ id, user_id, display_name, status, dt_start, dt_end }]
 *  - session:    { dt_start, dt_end, ... } (Date objects)
 *  - userId:     current user's id
 *  - onCreateRange({ start: Date, end: Date }): called when a drag completes
 *                or a best-time chip is clicked
 *  - readOnly:   disables drag-to-create (e.g. expired session)
 */
const SessionChart = ({
  timeRanges,
  newRangeIds = [],
  session,
  userId,
  onCreateRange,
  readOnly,
  onRangeDeleted,
  onNewRangeIdsProcessed,
}) => {
  const [showSelectRangeModal, setShowSelectRangeModal] = useState(false);
  const [focusRange, setFocusRange] = useState(undefined);
  const [drag, setDrag] = useState(null); // { dayIdx, anchor, current } (minutes from day start)
  const [hover, setHover] = useState(null); // { dayIdx, minute }
  const [drawMode, setDrawMode] = useState(false); // Touch devices: opt in so scrolling still works
  const [includeMaybe, setIncludeMaybe] = useState(false); // Do "maybe" responses count toward overlap?
  const [now, setNow] = useState(() => dayjs());
  const downInfo = useRef(null); // { startY, rangeId } for the active pointer
  const [highlightedRangeIds, setHighlightedRangeIds] = useState(() => new Set());
  const rangeHighlightTimers = useRef(new Map());

  useEffect(() => {
    const processedIds = [];
    newRangeIds.forEach((id) => {
      const key = String(id);
      if (rangeHighlightTimers.current.has(key)) return;
      processedIds.push(id);
      setHighlightedRangeIds((prev) => new Set(prev).add(key));
      const timer = setTimeout(() => {
        rangeHighlightTimers.current.delete(key);
        setHighlightedRangeIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 4200);
      rangeHighlightTimers.current.set(key, timer);
    });
    if (processedIds.length) onNewRangeIdsProcessed?.(processedIds);
  }, [newRangeIds, onNewRangeIdsProcessed]);

  useEffect(() => () => {
    rangeHighlightTimers.current.forEach((timer) => clearTimeout(timer));
    rangeHighlightTimers.current.clear();
  }, []);

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
  const layout = useMemo(() => buildChartLayout(session), [session]);

  /**
   * Slice every range into per-day segments (a range crossing midnight shows in
   * both day columns), then group by user and pack overlapping segments into
   * subcolumns within that user's column.
   */
  const segmentsByDay = useMemo(
    () => buildSegmentsByDay(layout, timeRanges),
    [layout, timeRanges]
  );

  /**
   * Overlap: for every half-hour slot, who is free for the WHOLE slot.
   * A person counts once per slot even if they added several ranges
   * ("going" wins over "maybe" if both cover the slot).
   * Best windows = runs of consecutive slots at the peak headcount (peak >= 2).
   */
  const heat = useMemo(
    () => buildOverlapHeat(layout, segmentsByDay, timeRanges, includeMaybe),
    [layout, segmentsByDay, timeRanges, includeMaybe]
  );

  if (!layout) {
    return <div className="sc-empty">Loading chart…</div>;
  }

  const { days, axisStart, hourPx, pxPerMin, bodyHeight, hourLabels } = layout;
  const canDraw = !readOnly;
  const yOf = (minute) => (minute - axisStart) * pxPerMin;
  const isMine = (range) => String(range.user_id) === String(userId);
  const hasRanges = (timeRanges || []).length > 0;
  const minDayWidth = Math.max(
    days.length > 3 ? 104 : 140,
    ...segmentsByDay.map(({ users }) => users.length * 88)
  );

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

  const slotTitle = (day, slot) => {
    const lines = [`${fmtMinute(day.date, slot.startMin)} – ${fmtMinute(day.date, slot.endMin)}`];
    lines.push(
      `${slot.going.length} going${slot.going.length ? ": " + slot.going.join(", ") : ""}`
    );
    if (slot.maybe.length) lines.push(`${slot.maybe.length} maybe: ${slot.maybe.join(", ")}`);
    return lines.join("\n");
  };

  return (
    <div className={`sc-wrap ${drawMode ? "sc-draw" : ""}`}>
      <SessionSelectRangeModal
        show={showSelectRangeModal}
        handleClose={() => setShowSelectRangeModal(false)}
        range={focusRange}
        session={session}
        userId={userId}
        onDeleted={onRangeDeleted}
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
          <span className="sc-legend-item">
            <i className="sc-swatch sc-heat" /> Overlap
          </span>
        </div>

        <div className="sc-toolbar-right">
          <button
            type="button"
            className={`sc-draw-toggle ${includeMaybe ? "active" : ""}`}
            onClick={() => setIncludeMaybe((v) => !v)}
            aria-pressed={includeMaybe}
            title="Include “maybe” responses in the overlap counts"
          >
            Count maybes
          </button>
          {canDraw && (
            <>
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
            </>
          )}
        </div>
      </div>

      {hasRanges && (
        <div className="sc-best">
          <span className="sc-best-label">Best times</span>
          {heat.best.length === 0 ? (
            <span className="sc-best-none">Shows up once two or more people overlap.</span>
          ) : (
            <>
              {heat.best.slice(0, MAX_BEST_CHIPS).map((w) => {
                const day = days[w.dayIdx].date;
                const content = (
                  <>
                    <span className="sc-chip-time">
                      {day.format("ddd")} {fmtMinute(day, w.startMin)} – {fmtMinute(day, w.endMin)}
                    </span>
                    <span className="sc-chip-sub">
                      {heat.peak} {includeMaybe ? "going or maybe" : "going"}
                    </span>
                  </>
                );
                const chipKey = `${w.dayIdx}-${w.startMin}`;
                return canDraw && onCreateRange ? (
                  <button
                    key={chipKey}
                    type="button"
                    className="sc-chip"
                    title="Add your availability for this time"
                    onClick={() =>
                      onCreateRange({
                        start: day.add(w.startMin, "minute").toDate(),
                        end: day.add(w.endMin, "minute").toDate(),
                      })
                    }
                  >
                    {content}
                  </button>
                ) : (
                  <span key={chipKey} className="sc-chip">
                    {content}
                  </span>
                );
              })}
              {heat.best.length > MAX_BEST_CHIPS && (
                <span className="sc-best-none">+{heat.best.length - MAX_BEST_CHIPS} more</span>
              )}
            </>
          )}
        </div>
      )}

      <div className="sc-scroll">
        <div
          className="sc-grid"
          style={{
            gridTemplateColumns: `56px repeat(${days.length}, minmax(${
              minDayWidth + HEAT_STRIP_PX
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
              {segmentsByDay[i].users.length > 0 && (
                <div className="sc-user-heads">
                  {segmentsByDay[i].users.map((user) => (
                    <span className="sc-user-head" key={user.key} title={user.name}>
                      {user.name}
                    </span>
                  ))}
                </div>
              )}
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
            const { segs, users, userCount } = segmentsByDay[dayIdx];
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

                {/* Best-time windows: dashed band across the whole column */}
                {heat.best
                  .filter((w) => w.dayIdx === dayIdx)
                  .map((w) => (
                    <div
                      key={`band-${w.startMin}`}
                      className="sc-best-band"
                      style={{
                        top: yOf(w.startMin),
                        height: (w.endMin - w.startMin) * pxPerMin,
                      }}
                    />
                  ))}

                {/* Overlap strip: darker = more people free for the whole slot */}
                <div className="sc-heat" style={{ width: HEAT_STRIP_PX }}>
                  {heat.byDay[dayIdx].slots.map((slot) => {
                    if (slot.score === 0 && slot.maybe.length === 0) return null;
                    const alpha =
                      heat.participants > 0 ? Math.min(slot.score / heat.participants, 1) : 0;
                    return (
                      <div
                        key={slot.startMin}
                        className="sc-heat-cell"
                        style={{
                          top: yOf(slot.startMin),
                          height: (slot.endMin - slot.startMin) * pxPerMin,
                          background:
                            slot.score > 0
                              ? `rgba(46, 160, 105, ${(0.14 + 0.66 * alpha).toFixed(2)})`
                              : "transparent",
                          color: alpha >= 0.6 ? "#fff" : "#0d3b26",
                        }}
                        title={slotTitle(day, slot)}
                      >
                        {slot.score > 0 && <span>{slot.score}</span>}
                        {!includeMaybe && slot.maybe.length > 0 && (
                          <span className="sc-heat-maybe">+{slot.maybe.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* User columns (to the right of the overlap strip) */}
                <div className="sc-lanes" style={{ left: HEAT_STRIP_PX }}>
                  {users.slice(1).map((user, index) => (
                    <div
                      key={`user-divider-${user.key}`}
                      className="sc-user-divider"
                      style={{ left: `${((index + 1) / userCount) * 100}%` }}
                    />
                  ))}
                  {segs.map((seg) => {
                    const { range } = seg;
                    const height = Math.max(
                      (seg.endMin - seg.startMin) * pxPerMin,
                      MIN_BLOCK_PX
                    );
                    const userWidthPct = 100 / userCount;
                    const laneWidthPct = seg.hasConflict
                      ? userWidthPct / seg.userLaneCount
                      : userWidthPct;
                    const leftPct =
                      seg.userIndex * userWidthPct +
                      (seg.hasConflict ? seg.lane * laneWidthPct : 0);
                    const label = isMine(range)
                      ? `${range.display_name} (Me)`
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
                          highlightedRangeIds.has(String(range.id)) ? "sc-new" : "",
                          seg.continuesBefore ? "cont-before" : "",
                          seg.continuesAfter ? "cont-after" : "",
                        ].join(" ")}
                        style={{
                          top: yOf(seg.startMin),
                          height,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${laneWidthPct}% - 4px)`,
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
                </div>

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
