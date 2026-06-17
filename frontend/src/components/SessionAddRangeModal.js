import { useEffect, useMemo, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";

import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { RequestHandler } from "../js/requestHandler";

/**
 * Modal for adding an availability range within a session.
 * Adapts its date/time picker UI based on the session's duration:
 *   - 1 day:  time-only pickers
 *   - 2 days: day dropdowns + time pickers
 *   - 3+ days: full date-time pickers
 */
const SessionAddRangeModal = ({ handleClose, show, session }) => {
  const [dtStatus, setDtStatus] = useState("going");
  const [dtStart, setdtStart] = useState(new Date());
  const [dtEnd, setdtEnd] = useState(new Date());
  const [isCreateRangeLoading, setIsCreateRangeLoading] = useState(false);
  const [warning, setWarning] = useState("");

  // Parse session boundaries once and memoize to avoid redundant re-computation
  const sessionStart = useMemo(
    () => (session?.dt_start ? dayjs(session.dt_start) : null),
    [session]
  );

  const sessionEnd = useMemo(
    () => (session?.dt_end ? dayjs(session.dt_end) : null),
    [session]
  );

  /**
   * Build an array of each calendar day covered by the session.
   * Used to populate the day-select dropdowns in the two-day picker.
   */
  const sessionDays = useMemo(() => {
    if (!sessionStart || !sessionEnd) return [];

    const days = [];
    let cursor = sessionStart.startOf("day");
    const lastDay = sessionEnd.startOf("day");

    while (cursor.isBefore(lastDay) || cursor.isSame(lastDay, "day")) {
      days.push(cursor);
      cursor = cursor.add(1, "day");
    }

    return days;
  }, [sessionStart, sessionEnd]);

  // Picker variant flags derived from how many days the session spans
  const isSameDay = sessionDays.length === 1;
  const isTwoDaySession = sessionDays.length === 2;
  const shouldUseDateTimePicker = sessionDays.length > 2;

  /**
   * Reset picker state to sensible defaults each time the modal opens.
   * Defaults the range to [sessionStart, sessionStart + 2h], capped at sessionEnd.
   */
  useEffect(() => {
    if (!show || !sessionStart || !sessionEnd) return;

    const defaultStart = sessionStart;
    const proposedEnd = sessionStart.add(2, "hour");
    const defaultEnd = proposedEnd.isAfter(sessionEnd)
      ? sessionEnd
      : proposedEnd;

    setdtStart(defaultStart.toDate());
    setdtEnd(defaultEnd.toDate());
    setDtStatus("going");
    setWarning("");
  }, [show, sessionStart, sessionEnd]);

  /**
   * Combines a calendar day with a time value to produce a full datetime.
   * @param {dayjs.Dayjs} day - the date to use (time fields ignored)
   * @param {dayjs.Dayjs} timeValue - the time to apply
   */
  const combineDayAndTime = (day, timeValue) => {
    return day
      .hour(timeValue.hour())
      .minute(timeValue.minute())
      .second(0)
      .millisecond(0);
  };

  /**
   * Clamps a datetime to within [sessionStart, sessionEnd].
   * Prevents the user from selecting times outside the session boundaries.
   */
  const clampToSession = (value) => {
    if (!sessionStart || !sessionEnd) return value;
    if (value.isBefore(sessionStart)) return sessionStart;
    if (value.isAfter(sessionEnd)) return sessionEnd;
    return value;
  };

  // Helpers to check whether a given date falls on the session's first/last day
  const isSessionStartDay = (date) => dayjs(date).isSame(sessionStart, "day");
  const isSessionEndDay = (date) => dayjs(date).isSame(sessionEnd, "day");

  /**
   * Min/max time bounds for the start time picker.
   * Constrained to session start on the first day, or midnight otherwise.
   */
  const getStartMinTime = () => {
    if (isSessionStartDay(dtStart)) return sessionStart;
    return dayjs(dtStart).startOf("day");
  };

  const getStartMaxTime = () => {
    if (isSessionEndDay(dtStart)) return sessionEnd;
    return dayjs(dtStart).endOf("day");
  };

  /**
   * Min/max time bounds for the end time picker.
   * When start and end share a day, end must be after start.
   */
  const getEndMinTime = () => {
    const selectedEnd = dayjs(dtEnd);
    const selectedStart = dayjs(dtStart);

    if (selectedEnd.isSame(selectedStart, "day")) {
      return selectedStart;
    }

    if (isSessionStartDay(dtEnd)) {
      return sessionStart;
    }

    return selectedEnd.startOf("day");
  };

  const getEndMaxTime = () => {
    if (isSessionEndDay(dtEnd)) return sessionEnd;
    return dayjs(dtEnd).endOf("day");
  };

  // Formatted day strings used as <select> values for the two-day picker
  const selectedStartDay = dayjs(dtStart).startOf("day").format("YYYY-MM-DD");
  const selectedEndDay = dayjs(dtEnd).startOf("day").format("YYYY-MM-DD");

  /**
   * Handles start day dropdown changes in the two-day picker.
   * Preserves the existing start time, then auto-advances end if needed.
   */
  const handleStartDayChange = (e) => {
    const selectedDay = dayjs(e.target.value);
    let newStart = combineDayAndTime(selectedDay, dayjs(dtStart));
    newStart = clampToSession(newStart);

    setdtStart(newStart.toDate());

    // If start is now at or after end, push end forward by 30 minutes
    if (newStart.isAfter(dayjs(dtEnd)) || newStart.isSame(dayjs(dtEnd))) {
      const newEnd = clampToSession(newStart.add(30, "minute"));
      setdtEnd(newEnd.toDate());
    }
  };

  /**
   * Handles end day dropdown changes in the two-day picker.
   * Preserves the existing end time, then pulls end back if it precedes start.
   */
  const handleEndDayChange = (e) => {
    const selectedDay = dayjs(e.target.value);
    let newEnd = combineDayAndTime(selectedDay, dayjs(dtEnd));
    newEnd = clampToSession(newEnd);

    if (newEnd.isBefore(dayjs(dtStart)) || newEnd.isSame(dayjs(dtStart))) {
      newEnd = clampToSession(dayjs(dtStart).add(30, "minute"));
    }

    setdtEnd(newEnd.toDate());
  };

  /**
   * Handles start time picker changes.
   * On single-day sessions, anchors the date to sessionStart's day.
   * Auto-advances end time if it would become invalid.
   */
  const handleStartTimeChange = (value) => {
    if (!value) return;

    let newStart = isSameDay
      ? combineDayAndTime(sessionStart.startOf("day"), value)
      : combineDayAndTime(dayjs(dtStart).startOf("day"), value);

    newStart = clampToSession(newStart);
    setdtStart(newStart.toDate());

    if (newStart.isAfter(dayjs(dtEnd)) || newStart.isSame(dayjs(dtEnd))) {
      const newEnd = clampToSession(newStart.add(30, "minute"));
      setdtEnd(newEnd.toDate());
    }
  };

  /**
   * Handles end time picker changes.
   * Clamps the result and corrects end if it would precede start.
   */
  const handleEndTimeChange = (value) => {
    if (!value) return;

    let newEnd = isSameDay
      ? combineDayAndTime(sessionStart.startOf("day"), value)
      : combineDayAndTime(dayjs(dtEnd).startOf("day"), value);

    newEnd = clampToSession(newEnd);

    if (newEnd.isBefore(dayjs(dtStart)) || newEnd.isSame(dayjs(dtStart))) {
      newEnd = clampToSession(dayjs(dtStart).add(30, "minute"));
    }

    setdtEnd(newEnd.toDate());
  };

  /**
   * Validates the selected range against session boundaries.
   * Returns an error string if invalid, or an empty string if valid.
   */
  const validateRange = () => {
    if (!sessionStart || !sessionEnd) return "Session is still loading.";

    const start = dayjs(dtStart);
    const end = dayjs(dtEnd);

    if (!start.isValid() || !end.isValid()) {
      return "Please select a valid start and end time.";
    }

    if (start.isBefore(sessionStart)) {
      return "Start time cannot be before the session starts.";
    }

    if (end.isAfter(sessionEnd)) {
      return "End time cannot be after the session ends.";
    }

    if (start.isAfter(end) || start.isSame(end)) {
      return "End time must be after start time.";
    }

    return "";
  };

  const validationMessage = validateRange();
  const isSubmitDisabled = Boolean(validationMessage) || isCreateRangeLoading;

  /**
   * Submits the availability range to the API.
   * Closes the modal on success.
   */
  const addDtRange = async () => {
    const error = validateRange();
    if (error) {
      setWarning(error);
      return;
    }

    try {
      setWarning("");
      setIsCreateRangeLoading(true);

      const res = await RequestHandler.req("/v1/sessiontimerange", "POST", {
        sessionId: session.id,
        sessionCode: session.code,
        dtStart,
        dtEnd,
        status: dtStatus,
      });

      setIsCreateRangeLoading(false);

      if (res.status !== 200) {
        setWarning(`Unable to add range. Error ${res.status}`);
        return;
      }

      handleClose();

      const resData = await res.json();
      console.log("Inserted dtRange with insertId:", resData.insertId);
    } catch (err) {
      setIsCreateRangeLoading(false);
      setWarning("Something went wrong while adding the range.");
      console.log("Error:", err);
    }
  };

  /** Single-day session: show time-only pickers, date is implicit */
  const renderSameDayPicker = () => (
    <>
      <div className="mb-2 text-muted">
        {sessionStart.format("ddd, MMM D YYYY")}
      </div>

      <div className="d-flex flex-column gap-3">
        <MobileTimePicker
          label="Start"
          value={dayjs(dtStart)}
          minTime={sessionStart}
          maxTime={sessionEnd}
          onChange={handleStartTimeChange}
          openTo="hours"
          views={["hours", "minutes"]}
          ampm
        />

        <MobileTimePicker
          label="End"
          value={dayjs(dtEnd)}
          minTime={dayjs(dtStart)}
          maxTime={sessionEnd}
          onChange={handleEndTimeChange}
          openTo="hours"
          views={["hours", "minutes"]}
          ampm
        />
      </div>
    </>
  );

  /** Two-day session: day dropdowns paired with time pickers */
  const renderTwoDayPicker = () => (
    <div className="d-flex flex-column gap-3">
      <div>
        <Form.Label>Start day</Form.Label>
        <Form.Select value={selectedStartDay} onChange={handleStartDayChange}>
          {sessionDays.map((day) => (
            <option
              key={day.format("YYYY-MM-DD")}
              value={day.format("YYYY-MM-DD")}
            >
              {day.format("ddd, MMM D YYYY")}
            </option>
          ))}
        </Form.Select>
      </div>

      <MobileTimePicker
        label="Start time"
        value={dayjs(dtStart)}
        minTime={getStartMinTime()}
        maxTime={getStartMaxTime()}
        onChange={handleStartTimeChange}
        openTo="hours"
        views={["hours", "minutes"]}
        ampm
      />

      <div>
        <Form.Label>End day</Form.Label>
        <Form.Select value={selectedEndDay} onChange={handleEndDayChange}>
          {sessionDays.map((day) => (
            <option
              key={day.format("YYYY-MM-DD")}
              value={day.format("YYYY-MM-DD")}
            >
              {day.format("ddd, MMM D YYYY")}
            </option>
          ))}
        </Form.Select>
      </div>

      <MobileTimePicker
        label="End time"
        value={dayjs(dtEnd)}
        minTime={getEndMinTime()}
        maxTime={getEndMaxTime()}
        onChange={handleEndTimeChange}
        openTo="hours"
        views={["hours", "minutes"]}
        ampm
      />
    </div>
  );

  /** 3+ day session: full date-time pickers, bounded to the session window */
  const renderDateTimePicker = () => (
    <div className="d-flex flex-column gap-3">
      <MobileDateTimePicker
        label="Start"
        value={dayjs(dtStart)}
        minDateTime={sessionStart}
        maxDateTime={sessionEnd}
        onChange={(value) => value && setdtStart(clampToSession(value).toDate())}
        openTo="day"
        views={["year", "day", "hours", "minutes"]}
        ampm
      />

      <MobileDateTimePicker
        label="End"
        value={dayjs(dtEnd)}
        minDateTime={dayjs(dtStart)}
        maxDateTime={sessionEnd}
        onChange={(value) => value && setdtEnd(clampToSession(value).toDate())}
        openTo="day"
        views={["year", "day", "hours", "minutes"]}
        ampm
      />
    </div>
  );

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Date Time Range</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Only render pickers once session boundaries are available */}
        {sessionStart && sessionEnd && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {isSameDay && renderSameDayPicker()}
            {isTwoDaySession && renderTwoDayPicker()}
            {shouldUseDateTimePicker && renderDateTimePicker()}
          </LocalizationProvider>
        )}

        <Form.Group className="mt-3 mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select
            aria-label="Availability status"
            value={dtStatus}
            onChange={(e) => setDtStatus(e.target.value)}
          >
            <option value="going">Going 👍</option>
            <option value="maybe">Maybe 🤷‍♂️</option>
          </Form.Select>
        </Form.Group>

        {/* Show validation errors — warning (post-submit) takes priority over live validation */}
        {(warning || validationMessage) && (
          <p className="text-warning mb-0">{warning || validationMessage}</p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          style={{ minWidth: "80px" }}
          onClick={handleClose}
        >
          Close
        </Button>

        <Button
          variant="primary"
          type="submit"
          style={{ minWidth: "80px" }}
          onClick={addDtRange}
          disabled={isSubmitDisabled}
        >
          {/* Show spinner while the POST request is in flight */}
          {!isCreateRangeLoading ? (
            <>Submit</>
          ) : (
            <AiOutlineLoading3Quarters className="spin" />
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionAddRangeModal;