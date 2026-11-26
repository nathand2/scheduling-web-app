import { useEffect, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import Row from "react-bootstrap/Row";

import SessionAttendence from "./SessionAttendence";
import SessionChart from "./SessionChart";
import SessionInfo from "./SessionInfo";
import GuidedTour, { type GuidedTourStep } from "./GuidedTour";
import type { AvailabilityRange, SessionRecord, UserSession } from "../types";

const USER_RANGES_STORAGE_KEY = "scheduler-demo-user-ranges-v1";
const LEGACY_SESSION_STORAGE_KEY = "scheduler-demo-session-v2";
const DEMO_USER_ID = "demo-you";

const demoTourSteps: GuidedTourStep[] = [
  {
    target: "[data-tour='session-info']",
    title: "Welcome to the scheduling demo",
    content: "This sample group is planning a weekend meetup. The attendees and their availability are sample data.",
  },
  {
    target: "[data-tour='availability-cell']",
    title: "Add your availability",
    content: "Drag across Friday, Saturday, or Sunday to choose a time. On a touch screen, turn on Draw first. You can also use the Add availability button.",
    actionPrompt: true,
  },
  {
    target: "[data-tour='heat-map']",
    title: "See where schedules overlap",
    content: "The green strip summarizes how many attendees are free at each time. Darker green means more people overlap.",
  },
  {
    target: ".sc-best",
    title: "Find the best times",
    content: "The chart highlights time windows that work for the most attendees. Select one to prefill your availability form for that time.",
  },
  {
    target: "[data-tour='count-maybes']",
    title: "Include maybe responses",
    content: "Turn this on to include maybe responses in overlap counts and best-time suggestions.",
  },
  {
    target: ".sc-block",
    title: "Inspect a range",
    content: "Select a block to see who added it. You can remove the availability you added during the demo.",
  },
  {
    target: "[data-tour='attendees']",
    title: "Meet the sample attendees",
    content: "The attendee list shows the sample people whose availability is already on the chart, plus you.",
  },
  {
    target: "[data-tour='add-availability']",
    title: "Enter exact times",
    content: "Use this button when you want to type specific start and end times instead of dragging on the chart.",
  },
];

interface DemoData {
  session: SessionRecord;
  timeRanges: AvailabilityRange[];
}

const makeDemoData = (): DemoData => {
  const today = dayjs().startOf("day");
  const daysUntilFriday = (5 - today.day() + 7) % 7 || 7;
  const start = today.add(daysUntilFriday, "day").hour(8).toDate();
  const end = dayjs(start).add(2, "day").hour(21).toDate();
  const at = (dayOffset: number, hour: number, minute = 0) =>
    dayjs(start).startOf("day").add(dayOffset, "day").hour(hour).minute(minute).toDate();

  return {
    session: {
      id: "demo-session",
      code: "DEMO",
      session_title: "Plan a weekend meetup",
      session_desc: "A sample session to explore the availability chart.",
      dt_start: start,
      dt_end: end,
      dt_created: new Date(),
    },
    timeRanges: [
      { id: "demo-range-1", user_id: 101, display_name: "Alex", status: "going", dt_start: at(0, 9), dt_end: at(0, 17) },
      { id: "demo-range-2", user_id: 101, display_name: "Alex", status: "going", dt_start: at(1, 10), dt_end: at(1, 18) },
      { id: "demo-range-3", user_id: 101, display_name: "Alex", status: "going", dt_start: at(2, 8), dt_end: at(2, 13) },
      { id: "demo-range-4", user_id: 101, display_name: "Alex", status: "going", dt_start: at(2, 12), dt_end: at(2, 20) },
      { id: "demo-range-5", user_id: 102, display_name: "Sam", status: "going", dt_start: at(0, 11), dt_end: at(0, 19) },
      { id: "demo-range-6", user_id: 102, display_name: "Sam", status: "going", dt_start: at(1, 8), dt_end: at(1, 16) },
      { id: "demo-range-7", user_id: 102, display_name: "Sam", status: "going", dt_start: at(1, 16), dt_end: at(1, 21) },
      { id: "demo-range-8", user_id: 102, display_name: "Sam", status: "going", dt_start: at(2, 13), dt_end: at(2, 21) },
      { id: "demo-range-9", user_id: 103, display_name: "Jordan", status: "maybe", dt_start: at(0, 13), dt_end: at(0, 21) },
      { id: "demo-range-10", user_id: 103, display_name: "Jordan", status: "going", dt_start: at(1, 11), dt_end: at(1, 19) },
      { id: "demo-range-11", user_id: 103, display_name: "Jordan", status: "going", dt_start: at(2, 8), dt_end: at(2, 16) },
      { id: "demo-range-12", user_id: 103, display_name: "Jordan", status: "maybe", dt_start: at(2, 16), dt_end: at(2, 21) },
    ],
  };
};

const loadDemoData = (): DemoData => {
  const freshDemo = makeDemoData();
  try {
    window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    const saved = window.localStorage.getItem(USER_RANGES_STORAGE_KEY);
    if (saved) {
      const savedRanges = JSON.parse(saved);
      if (Array.isArray(savedRanges)) {
        const currentSessionStart = dayjs(freshDemo.session.dt_start).startOf("day");
        const guestRanges = savedRanges
          .filter((range) => range && String(range.user_id) === DEMO_USER_ID)
          .map((range: AvailabilityRange): AvailabilityRange | null => {
            const savedStart = dayjs(range.dt_start);
            const savedEnd = dayjs(range.dt_end);
            if (!savedStart.isValid() || !savedEnd.isValid() || !savedEnd.isAfter(savedStart)) {
              return null;
            }

            // Preserve the visitor's weekday and time if the rolling demo dates change.
            const startDayOffset = (savedStart.day() - 5 + 7) % 7;
            const endDayOffset = (savedEnd.day() - 5 + 7) % 7;
            if (startDayOffset > 2 || endDayOffset > 2) return null;

            const rebaseDate = (date: Dayjs, dayOffset: number) =>
              currentSessionStart
                .add(dayOffset, "day")
                .hour(date.hour())
                .minute(date.minute())
                .second(date.second())
                .millisecond(date.millisecond())
                .toDate();

            return {
              ...range,
              dt_start: rebaseDate(savedStart, startDayOffset),
              dt_end: rebaseDate(savedEnd, endDayOffset),
              dt_created: range.dt_created ? new Date(range.dt_created as string) : undefined,
            };
          })
          .filter((range): range is AvailabilityRange => range !== null);

        return { ...freshDemo, timeRanges: [...freshDemo.timeRanges, ...guestRanges] };
      }
    }
  } catch {
    // Use the fresh in-memory sample if storage is unavailable or malformed.
  }
  return freshDemo;
};

const toDateTimeInput = (date: Date) => dayjs(date).format("YYYY-MM-DDTHH:mm");

const DemoSession = () => {
  const [demo, setDemo] = useState<DemoData>(loadDemoData);
  const [showTour, setShowTour] = useState(true);
  const [tourStartDelayMs, setTourStartDelayMs] = useState(900);
  const [tourActionVersion, setTourActionVersion] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRangeDetails, setShowRangeDetails] = useState(false);
  const [draftRange, setDraftRange] = useState<{ start: Date; end: Date } | null>(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangeStatus, setRangeStatus] = useState("going");
  const [formError, setFormError] = useState("");
  const [userSessions] = useState<UserSession[]>([
    { id: 101, display_name: "Alex", role: "owner" },
    { id: 102, display_name: "Sam" },
    { id: 103, display_name: "Jordan" },
    { id: DEMO_USER_ID, display_name: "You" },
  ]);

  useEffect(() => {
    try {
      const userRanges = demo.timeRanges.filter(
        (range) => String(range.user_id) === DEMO_USER_ID
      );
      window.localStorage.setItem(USER_RANGES_STORAGE_KEY, JSON.stringify(userRanges));
    } catch {
      // The demo still works for this visit if browser storage is disabled.
    }
  }, [demo]);

  const openAddModal = (range?: { start: Date; end: Date } | null) => {
    const start = range?.start ?? new Date(demo.session.dt_start as Date);
    const end = range?.end ?? dayjs(start).add(1, "hour").toDate();
    setDraftRange(range ?? null);
    setRangeStart(toDateTimeInput(start));
    setRangeEnd(toDateTimeInput(end));
    setRangeStatus("going");
    setFormError("");
    setShowAddModal(true);
  };

  const saveRange = () => {
    const start = dayjs(rangeStart);
    const end = dayjs(rangeEnd);
    const sessionStart = dayjs(demo.session.dt_start);
    const sessionEnd = dayjs(demo.session.dt_end);
    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
      setFormError("Choose an end time after the start time.");
      return;
    }
    if (start.isBefore(sessionStart) || end.isAfter(sessionEnd)) {
      setFormError("Availability must be within the sample session dates.");
      return;
    }

    const range: AvailabilityRange = {
      id: `guest-${Date.now()}`,
      user_id: DEMO_USER_ID,
      display_name: "You",
      status: rangeStatus,
      dt_start: start.toDate(),
      dt_end: end.toDate(),
      dt_created: new Date(),
    };
    setDemo((current) => ({ ...current, timeRanges: [...current.timeRanges, range] }));
    setTourActionVersion((version) => version + 1);
    setShowAddModal(false);
    setDraftRange(null);
  };

  const resetDemo = () => {
    try {
      window.localStorage.removeItem(USER_RANGES_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    } catch {
      // Reset the in-memory demo even when storage is unavailable.
    }
    setDemo(makeDemoData());
  };

  const restartTour = () => {
    setTourStartDelayMs(150);
    if (showTour) {
      setShowTour(false);
      window.setTimeout(() => setShowTour(true), 0);
    } else {
      setShowTour(true);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <div>
          {/* <Link to="/" className="text-accent-blue">← Home</Link> */}
          <h1 className="mt-2">Interactive demo</h1>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={restartTour}>Replay tour</Button>
          <Button variant="outline-secondary" onClick={resetDemo}>Reset demo</Button>
        </div>
      </div>
      <Alert variant="info">
        This is a solo demo with sample attendees. Add or delete your own availability to try it out;
        changes are saved only in this browser and are not shared with anyone.
      </Alert>

      <SessionInfo session={demo.session} expiredSession={false} />
      <div className="d-flex justify-content-end mb-2">
        <Button onClick={() => openAddModal()} data-tour="add-availability">Add availability</Button>
      </div>
      <GuidedTour
        open={showTour}
        paused={showAddModal || showRangeDetails}
        steps={demoTourSteps}
        actionVersion={tourActionVersion}
        startDelayMs={tourStartDelayMs}
        onClose={() => setShowTour(false)}
      />
      <Row className="justify-content-md-center">
        <Col lg={8} md={12}>
          <SessionChart
            timeRanges={demo.timeRanges}
            session={demo.session}
            userId={DEMO_USER_ID}
            onCreateRange={(range) => openAddModal(range)}
            onRangeDetailsChange={setShowRangeDetails}
            onDeleteRange={(range) =>
              setDemo((current) => ({
                ...current,
                timeRanges: current.timeRanges.filter((item) => item.id !== range.id),
              }))
            }
          />
        </Col>
        <Col lg={4} md={12}>
          <SessionAttendence userSessions={userSessions} />
        </Col>
      </Row>

      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{draftRange ? "Add availability" : "Add your availability"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Availability</Form.Label>
              <Form.Select value={rangeStatus} onChange={(event) => setRangeStatus(event.target.value)}>
                <option value="going">Going</option>
                <option value="maybe">Maybe</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start</Form.Label>
              <Form.Control type="datetime-local" value={rangeStart} onChange={(event) => setRangeStart(event.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>End</Form.Label>
              <Form.Control type="datetime-local" value={rangeEnd} onChange={(event) => setRangeEnd(event.target.value)} />
            </Form.Group>
            {formError && <p className="text-danger mt-3 mb-0">{formError}</p>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button onClick={saveRange}>Save availability</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DemoSession;
