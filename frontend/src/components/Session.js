import { useEffect, useState, useRef } from "react";
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

import { RequestHandler } from "../js/requestHandler";
const util = require("../js/util");

const webSocketEndpoint = RequestHandler.webSocketEndpoint;
const showDtRangeUpdateToast = false; // Websocket for dtrange add

const Session = ({ userId }) => {
  const params = useParams();
  const [session, setSession] = useState({});
  const [timeRanges, setTimeRanges] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [showDtModal, setShowDtModal] = useState(false);
  const [draftRange, setDraftRange] = useState(null); // Range dragged on the chart, prefills the modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [expiredSession, setExpiredSession] = useState(undefined);
  const [sessionResStatus, setSessionResStatus] = useState();
  const [otherSessionResViews, setOtherSessionResViews] = useState();
  const socketRef = useRef(null);

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
    const socket = io(webSocketEndpoint);

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
      setTimeRanges((prev) =>
        data.id !== undefined && prev.some((r) => r.id === data.id)
          ? prev
          : [...prev, data]
      );

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
            onCreated={() => getTimeRanges(session.id)}
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
                    variant="primary"
                    onClick={handleShowDt}
                    disabled={expiredSession}
                  >
                    Add availability
                  </Button>
                </div>
                <SessionChart
                  timeRanges={timeRanges}
                  session={session}
                  userId={userId}
                  onCreateRange={handleDragCreate}
                  readOnly={Boolean(expiredSession)}
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