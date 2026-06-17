import { useMemo, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import { Navigate } from "react-router-dom";

import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";

import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { RequestHandler } from "../js/requestHandler";

const SessionCreate = () => {
  // Memoize current time so it doesn't shift between renders
  const now = useMemo(() => dayjs(), []);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dtStart, setdtStart] = useState(now.toDate());
  // Default session duration is 4 hours
  const [dtEnd, setdtEnd] = useState(now.add(4, "hour").toDate());
  const [viewOption, setViewOption] = useState("account-only");

  const [sessionCreated, setSessionCreated] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isCreateSessionLoading, setIsCreateSessionLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [statusTextClass, setStatusTextClass] = useState("text-danger");

  /**
   * Validates that the selected start/end times form a valid session range.
   * Returns an error string if invalid, or an empty string if valid.
   */
  const validateSessionRange = () => {
    const start = dayjs(dtStart);
    const end = dayjs(dtEnd);
    const currentTime = dayjs();

    if (!start.isValid() || !end.isValid()) {
      return "Please select a valid start and end time.";
    }

    // Uncomment to prevent sessions from being scheduled in the past
    // if (start.isBefore(currentTime)) {
    //   return "Session start cannot be in the past.";
    // }

    if (start.isAfter(end) || start.isSame(end)) {
      return "Session end must be after session start.";
    }

    // Enforce a minimum session length of 30 minutes
    const diffInMinutes = end.diff(start, "minute");
    if (diffInMinutes < 31) {
      return "Session must be longer than 30 minutes.";
    }

    return "";
  };

  const validationMessage = validateSessionRange();
  // Disable submit if validation fails or a request is already in flight
  const isSubmitDisabled = Boolean(validationMessage) || isCreateSessionLoading;

  /**
   * Updates the start time. If the new start is at or after the current end,
   * auto-advances the end time to 4 hours after the new start.
   */
  const handleStartChange = (value) => {
    if (!value) return;

    const newStart = value;
    setdtStart(newStart.toDate());

    if (newStart.isAfter(dayjs(dtEnd)) || newStart.isSame(dayjs(dtEnd))) {
      setdtEnd(newStart.add(4, "hour").toDate());
    }
  };

  const handleEndChange = (value) => {
    if (!value) return;
    setdtEnd(value.toDate());
  };

  /**
   * Validates and creates session with POST request.
   * Navigates to the new session page on success.
   * @param {object} e - form submit event
   */
  const createSession = async (e) => {
    e.preventDefault();
    setStatusText("");

    const error = validateSessionRange();
    if (error) {
      setStatusTextClass("text-danger");
      setStatusText(error);
      return;
    }

    const session = {
      title,
      desc: desc === "" ? undefined : desc, // Omit description if empty
      dtStart,
      dtEnd,
      attendType: viewOption,
    };

    setIsCreateSessionLoading(true);

    try {
      const res = await RequestHandler.req("/v1/session", "POST", session);
      setIsCreateSessionLoading(false);

      if (res.status < 200 || res.status > 299) {
        setStatusTextClass("text-danger");
        setStatusText(`Error: Unable to create session ${res.status}`);
        return;
      }

      const sessionData = await res.json();

      // Redirect to the newly created session using its code
      setSessionId(sessionData.code);
      setSessionCreated(true);
    } catch (err) {
      setIsCreateSessionLoading(false);
      setStatusTextClass("text-danger");
      setStatusText("Unable to create session at this time.");
      console.log("Unable to create session. Error:", err);
    }
  };

  return (
    <div>
      {/* Redirect to the session page once it's been successfully created */}
      {sessionCreated && <Navigate to={`/session/${sessionId}`} />}

      <h1 className="text-accent-blue">Create Session</h1>

      <Container className="sessions-preview d-flex flex-wrap bd-highlight" />

      <Form onSubmit={createSession}>
        <Form.Group
          className="mb-3 flex-col small-form-group text-start"
          controlId="formGroupTitle"
        >
          <Form.Label>Session Title</Form.Label>
          <Form.Control
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group
          className="mb-3 flex-col small-form-group text-start"
          controlId="formGroupDesc"
        >
          <Form.Label>Session Description</Form.Label>
          <Form.Control
            placeholder="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </Form.Group>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Form.Group className="mb-3 flex-col small-form-group text-start">
            <Form.Label>Session Start</Form.Label>
            <MobileDateTimePicker
              label="Start"
              value={dayjs(dtStart)}
              // Allow selecting times slightly in the past (within 31 min) for flexibility
              minDateTime={dayjs().subtract(31, "minute")}
              onChange={handleStartChange}
              openTo="day"
              views={["year", "day", "hours", "minutes"]}
              ampm
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                },
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3 flex-col small-form-group text-start">
            <Form.Label>Session End</Form.Label>
            <MobileDateTimePicker
              label="End"
              value={dayjs(dtEnd)}
              // End must be at least 31 minutes after start
              minDateTime={dayjs(dtStart).add(31, "minute")}
              onChange={handleEndChange}
              openTo="day"
              views={["year", "day", "hours", "minutes"]}
              ampm
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                },
              }}
            />
          </Form.Group>
        </LocalizationProvider>

        {/* Attendance type selector — commented out pending group support */}
        {/* <Form.Group className="mb-3 flex-col small-form-group text-start">
          <Form.Label>Who can attend my Session?</Form.Label>
          <Form.Select
            aria-label="Default select example"
            value={viewOption}
            onChange={(e) => setViewOption(e.target.value)}
          >
            <option value="account-only">People with accounts</option>
            <option value="group-only" disabled>
              Specific Group (Coming Soon...🙃)
            </option>
          </Form.Select>
        </Form.Group> */}

        {/* Show live validation feedback as the user edits dates */}
        {validationMessage && (
          <Form.Group className="mb-3">
            <p className="text-warning">{validationMessage}</p>
          </Form.Group>
        )}

        {/* Show success/error feedback after a submit attempt */}
        {statusText && (
          <Form.Group className="mb-3">
            <p className={statusTextClass}>{statusText}</p>
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Button
            variant="primary"
            type="submit"
            style={{ minWidth: "160px" }}
            disabled={isSubmitDisabled}
          >
            {/* Show spinner while the request is in flight */}
            {!isCreateSessionLoading ? (
              <>Create Session</>
            ) : (
              <AiOutlineLoading3Quarters className="spin" />
            )}
          </Button>
        </Form.Group>
      </Form>

      <Container />
    </div>
  );
};

export default SessionCreate;