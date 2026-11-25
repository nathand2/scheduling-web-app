import { useCallback, useEffect, useState, useRef, type ReactNode } from "react";
import { useParams } from "react-router-dom";

import { io } from "socket.io-client";

import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";

import SessionHeader from "./SessionHeader";
import SessionInfo from "./SessionInfo";
import SessionShareModal from "./SessionShareModal";
import SessionAddRangeModal from "./SessionAddRangeModal";
import SessionToast from "./SessionToast";
import SessionChart from "./SessionChart";
import SessionAttendence from "./SessionAttendence";
import GuidedTour, { type GuidedTourStep } from "./GuidedTour";

import { RequestHandler } from "../js/requestHandler";
import * as util from "../js/util";
import type { AvailabilityRange, SessionRecord, UserSession } from "../types";

const webSocketEndpoint = RequestHandler.webSocketEndpoint;
const showDtRangeUpdateToast = false; // Websocket for dtrange add
const sessionTourSteps: GuidedTourStep[] = [
  {
    target: "[data-tour='session-info']",
    title: "Choose a session window",
    content: "This session has a date range. The chart below shows each day when people can meet.",
  },
  {
    target: "[data-tour='availability-cell']",
    title: "Add your availability",
    content: "Drag across a day to mark when you’re free. On a touch screen, turn on Draw first. You can also use Add availability to enter exact times.",
    requiresAction: true,
  },
  {
    target: "[data-tour='heat-map']",
    title: "See where schedules overlap",
    content: "The shaded strip summarizes how many attendees are free at each time. Darker green means more people overlap.",
  },
  {
    target: ".sc-best",
    title: "Find the best times",
    content: "These suggestions highlight the time windows with the most overlap. Select one to prefill your availability form for that time.",
  },
  {
    target: "[data-tour='count-maybes']",
    title: "Include maybe responses",
    content: "Turn this on to include maybe responses in the overlap counts and best-time suggestions.",
  },
  {
    target: ".sc-block",
    title: "Inspect an availability range",
    content: "Select a block to see who added it and the exact time. You can remove your own ranges from the details.",
  },
  {
    target: "[data-tour='attendees']",
    title: "Check who has joined",
    content: "The attendee list shows who is part of this session, including the session owner.",
  },
  {
    target: "[data-tour='add-availability']",
    title: "Enter exact times",
    content: "Use Add availability when you want to enter precise start and end times instead of dragging on the chart.",
  },
  {
    target: "[data-tour='share-session']",
    title: "Invite the group",
    content: "Share the session link so other attendees can add their availability and see the same live schedule.",
  },
];

const Session = ({ userId }) => {
  const params = useParams();
  const [session, setSession] = useState<SessionRecord>({});
  const [timeRanges, setTimeRanges] = useState<AvailabilityRange[]>([]);
  const [newRangeIds, setNewRangeIds] = useState<Array<string | number>>([]);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [showDtModal, setShowDtModal] = useState(false);
  const [showRangeDetails, setShowRangeDetails] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourActionVersion, setTourActionVersion] = useState(0);
  const [draftRange, setDraftRange] = useState(null); // Range dragged on the chart, prefills the modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [expiredSession, setExpiredSession] = useState<boolean | undefined>(undefined);
  const [sessionResStatus, setSessionResStatus] = useState<number | undefined>(undefined);
  const [otherSessionResViews, setOtherSessionResViews] = useState<ReactNode>(undefined);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const knownRangeIds = useRef<Set<string | number>>(new Set());

  // Gets session data on load
  useEffect(() => {
    let isMounted = true;
    const getSessionData = async () => {
      try {
        const res = await RequestHandler.req(`/v1/session/${params.code}`, "GET");
        if (!isMounted) return; // bail if unmounted during async call

        setSessionResStatus(res.status);

        // Bail before touching the body: error responses may not include a session,
        // and the old order (parse, then check status) could throw on a 403/404.
        if (res.status !== 200) {
          changeOtherSessionViews(res);
          return;
        }

        const data = await res.json();
        if (!isMounted) return;
        const sessionData = data.session;

        sessionData.dt_end = util.convertUTCStringToDate(sessionData.dt_end);
        sessionData.dt_start = util.convertUTCStringToDate(sessionData.dt_start);
        sessionData.dt_created = util.convertUTCStringToDate(
          sessionData.dt_created
        );
        setSession(sessionData);
        setExpiredSession(new Date() > sessionData.dt_end);

        await getTimeRanges(sessionData.id);
        await getUserSessions(sessionData.id);

        // In dev (StrictMode) this effect runs twice; the isMounted flag makes
        // only the surviving mount open a socket.
        if (!isMounted) return;
        socketRef.current = setUpWebSocketConnection(sessionData.code);
      } catch (err) {
        console.log("Error:", err);
      }
    };

    getSessionData();
    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sets up Web Socket Connection
   * @param {string} code - Session Code
   */
  const setUpWebSocketConnection = (code) => {
    if (code === undefined) return null;

    // socket.io reconnects on its own with backoff; no manual connect_error retry needed
    const socket = io(webSocketEndpoint, {
      path: RequestHandler.webSocketPath,
      withCredentials: true,
      auth: (callback) => callback({ token: RequestHandler.getAccessToken() })
    });

    // Fires on first connect and on every automatic reconnect, so the room is rejoined
    socket.on("connect", () => {
      socket.emit("room", code);
    });

    socket.on("message", (data) => {
      console.log("Incoming message:", data);
    });

    socket.on("joinSession", (data) => {
      setUserSessions((prev) => [...prev, data]);
      setToastTitle(`Someone joined!`);
      setToastMessage(`${data.display_name} joined the session!`);
      setShowToast(true);
    });

    socket.on("postSessionTimeRange", (data) => {
      // Convert UTC date strings to dates
      data.dt_end = util.convertUTCStringToDate(data.dt_end);
      data.dt_start = util.convertUTCStringToDate(data.dt_start);
      data.dt_created = util.convertUTCStringToDate(data.dt_created);

      // Skip if we already have it (e.g. we refetched right after creating it)
      if (data.id !== undefined && knownRangeIds.current.has(data.id)) return;
      if (data.id !== undefined) knownRangeIds.current.add(data.id);
      setTimeRanges((prev) => [...prev, data]);
      if (data.id !== undefined) setNewRangeIds((prev) => [...prev, data.id]);

      if (showDtRangeUpdateToast) {
        if (String(data.user_id) === String(userId)) {
          setToastTitle(`Thanks for joining!`);
          setToastMessage(`We'll let everyone here know`);
        } else {
          setToastTitle(`Good News!`);
          setToastMessage(
            `${data.display_name} is ${
              data.status === "maybe" ? "maybe " : ""
            }coming!`
          );
        }
        setShowToast(true);
      }
    });

    socket.on("deleteSessionTimeRange", (data) => {
      setTimeRanges((prev) =>
        prev.filter((range) => range.id !== data.sessionTimeRangeId)
      );
    });

    return socket;
  };

  // Add-range modal. The button opens it blank; dragging on the chart opens it prefilled.
  const handleCloseDt = () => setShowDtModal(false);
  const handleShowDt = () => {
    setDraftRange(null);
    setShowDtModal(true);
  };
  const handleDragCreate = (range) => {
    setDraftRange(range);
    setShowDtModal(true);
  };
  const handleNewRangeIdsProcessed = useCallback((processedIds) => {
    const processed = new Set(processedIds.map(String));
    setNewRangeIds((prev) => prev.filter((id) => !processed.has(String(id))));
  }, []);

  // Share modal
  const handleCloseShare = () => setShowShareModal(false);
  const handleShowShare = () => setShowShareModal(true);

  /**
   * Change view for non-OK responses.
   * @param {object} res
   */
  const changeOtherSessionViews = (res) => {
    if (res.status === 401) {
      setOtherSessionResViews(<>Please log in</>);
    } else if (res.status === 403) {
      setOtherSessionResViews(<>Not invited</>);
    } else if (res.status === 404) {
      setOtherSessionResViews(<>Session Not Found</>);
    } else {
      setOtherSessionResViews(<>Oops, something went wrong</>);
    }
  };

  /**
   * Gets time ranges from api
   * @param {int} sessionId
   */
  const getTimeRanges = async (sessionId) => {
    const res = await RequestHandler.req(
      `/v1/timeranges?sessionid=${sessionId}`,
      "GET"
    );
    const data = await res.json();
    const timeRangeData = data.results.map((timeRange) => ({
      ...timeRange,
      dt_created: util.convertUTCStringToDate(timeRange.dt_created),
      dt_start: util.convertUTCStringToDate(timeRange.dt_start),
      dt_end: util.convertUTCStringToDate(timeRange.dt_end),
    }));
    knownRangeIds.current = new Set(timeRangeData.map((range) => range.id));
    setTimeRanges(timeRangeData);
  };

  /**
   * Gets user sessions from api
   * @param {int} sessionId
   */
  const getUserSessions = async (sessionId) => {
    const res = await RequestHandler.req(
      `/v1/usersessions?sessionid=${sessionId}`,
      "GET"
    );
    const data = await res.json();
    setUserSessions(data.userSessions);
  };

  return (
    <div>
      {sessionResStatus === undefined && (
        <Container
          className="d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: "80vh" }}
        >
          <h1 className="text-accent-blue text-center">
            Please wait, loading your session...
          </h1>
        </Container>
      )}

      {sessionResStatus === 200 && (
        <>
          <SessionHeader showShareModal={handleShowShare} />
          <SessionShareModal
            show={showShareModal}
            handleClose={handleCloseShare}
          />
          <SessionAddRangeModal
            show={showDtModal}
            handleClose={handleCloseDt}
            session={session}
            initialRange={draftRange}
            // Don't rely on the websocket echo for your own data: refetch on success
            onCreated={() => {
              setTourActionVersion((version) => version + 1);
              return getTimeRanges(session.id);
            }}
          />
          <GuidedTour
            open={showTour}
            paused={showDtModal || showShareModal || showRangeDetails}
            steps={expiredSession
              ? sessionTourSteps.filter((step) => !step.requiresAction)
              : sessionTourSteps}
            actionVersion={tourActionVersion}
            onClose={() => setShowTour(false)}
          />
          <Container fluid>
            <Row className="justify-content-md-center">
              <Col lg={8} md={12}>
                <SessionInfo
                  session={session}
                  expiredSession={expiredSession}
                />
                <div className="d-flex justify-content-end mb-2">
                  <Button
                    variant="outline-secondary"
                    className="me-2"
                    onClick={() => setShowTour(true)}
                  >
                    Take a tour
                  </Button>
                  <Button
                    variant={!expiredSession ? "primary" : "secondary"}
                    onClick={handleShowDt}
                    disabled={expiredSession}
                    data-tour="add-availability"
                  >
                    Add availability
                  </Button>
                </div>
                <SessionChart
                  timeRanges={timeRanges}
                  newRangeIds={newRangeIds}
                  onNewRangeIdsProcessed={handleNewRangeIdsProcessed}
                  session={session}
                  userId={userId}
                  onCreateRange={handleDragCreate}
                  readOnly={Boolean(expiredSession)}
                  onRangeDetailsChange={setShowRangeDetails}
                  onRangeDeleted={() => {
                    setToastTitle("Range deleted");
                    setToastMessage("Your availability range was deleted.");
                    setShowToast(true);
                  }}
                />
              </Col>
              <Col lg={4} md={12}>
                <SessionAttendence userSessions={userSessions} />
              </Col>
            </Row>
          </Container>

          {showToast && (
            <SessionToast
              title={toastTitle}
              message={toastMessage}
              show={showToast}
              setShow={setShowToast}
            />
          )}

          <br />
        </>
      )}

      {sessionResStatus !== undefined && sessionResStatus !== 200 && (
        <Container
          className="d-flex flex-column align-items-center justify-content-center"
          style={{ minHeight: "80vh" }}
        >
          <h1 className="text-accent-red text-center">
            Sorry, unable to load your session at this time
          </h1>
          <p>Error: {sessionResStatus}</p>
          {otherSessionResViews}
        </Container>
      )}
    </div>
  );
};

export default Session;
