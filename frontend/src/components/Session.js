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
  const [params, setParams] = useState(useParams());
  const [session, setSession] = useState({});
  const [timeRanges, setTimeRanges] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [showDtModal, setShowDtModal] = useState(false);
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
      // Get session data from api
      try {
        let res;
        res = await RequestHandler.req(`/session/${params.code}`, "GET");
        if (!isMounted) return; // bail if unmounted during async call

        setSessionResStatus(res.status);

        const data = await res.json();
        const sessionData = data.session;
        console.log("Session Data:", sessionData)

        sessionData.dt_end = util.convertUTCStringToDate(sessionData.dt_end);
        sessionData.dt_start = util.convertUTCStringToDate(sessionData.dt_start);
        sessionData.dt_created = util.convertUTCStringToDate(
          sessionData.dt_created
        );
        await setSession(sessionData);

        // Determine if session is expired
        setExpiredSession(new Date() > sessionData.dt_end);
        if (res.status !== 200) {
          changeOtherSessionViews(res);
          return;
        }
        await getTimeRanges(sessionData.id);
        await getUserSessions(sessionData.id);

        // Set up websocket
        // !In development mode, there was a bug where the Websocket connection was set up twice.
        // !From the POV of other in the room, you join it 2 times
        // !isMounted flag used essentially establishes web socket connection on second mount
        // !Shouldn't affect prod build anyways
        if (!isMounted) return;
        socketRef.current = await setUpWebSocketConnection(sessionData.code);  // set socket
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
  }, []);

  /**
   * Sets up Web Socket Connection
   * @param {string} code - Session Code
   */
  const setUpWebSocketConnection = async (code) => {
    // Connect to web socket if session.code not undefined
    if (code !== undefined) {
      let socket;
      try {
        socket = io(webSocketEndpoint);
        console.log("WebSocket connection successful");
      } catch (err) {
        console.log("WebSocket connection error:", err);
      }

      socket.on("connect", function () {
        socket.emit("room", code);
      });

      socket.on("connect_error", () => {
        setTimeout(() => socket.connect(), 5000);
      });

      socket.on("connect", function () {
        // Connected, let's sign-up for to receive messages for this room
        socket.emit("room", code);
      });

      socket.on("message", function (data) {
        console.log("Incoming message:", data);
      });

      socket.on("joinSession", function (data) {
        console.log("New user joined!:", data);
        setUserSessions((prev) => {
          return [...prev, data];
        });
        setToastTitle(`Someone joined!`);
        setToastMessage(`${data.display_name} joined the session!`);
        setShowToast(true);
      });

      socket.on("postSessionTimeRange", async function (data) {
        // Convert UTC date strings to dates
        data.dt_end = util.convertUTCStringToDate(data.dt_end);
        data.dt_start = util.convertUTCStringToDate(data.dt_start);
        data.dt_created = util.convertUTCStringToDate(data.dt_created);

        // Adds new range to timeRanges state.
        setTimeRanges((prev) => {
          return [...prev, data];
        });
        if (showDtRangeUpdateToast) {
          if (data.user_id === parseInt(localStorage.userId)) {
            setToastTitle(`Thanks for joining!`);
            setToastMessage(`We'll let everyone here know`);
            setShowToast(true);
          } else {
            setToastTitle(`Good News!`);
            setToastMessage(
              `${data.display_name} is ${
                data.status === "maybe" ? "maybe " : ""
              }coming!`
            );
            setShowToast(true);
          }
        }
      });
      socket.on("deleteSessionTimeRange", function (data) {
        console.log("Someone deleted timerange!:", data);
        setTimeRanges((prev) => {
          return prev.filter((range) => range.id !== data.sessionTimeRangeId);
        });
      });
      return socket;
    }
  };

  // Handling Dt Range Modal Show/Close
  const handleCloseDt = () => setShowDtModal(false);
  const handleShowDt = () => setShowDtModal(true);

  // Handling Share Modal Show/Close
  const handleCloseShare = () => {
    setShowShareModal(false);
  };
  const handleShowShare = () => {
    setShowShareModal(true);
  };

  // /**
  //  * Gets session data from api
  //  * @returns object - Session Data
  //  */
  // const getSession = async () => {
  //   try {
  //     let res;
  //     res = await RequestHandler.req(`/session/${params.code}`, "GET");
  //     setSessionResStatus(res.status);

  //     const data = await res.json();
  //     const sessionData = data.session;
  //     console.log("Session Data:")
  //     console.log(sessionData)

  //     sessionData.dt_end = util.convertUTCStringToDate(sessionData.dt_end);
  //     sessionData.dt_start = util.convertUTCStringToDate(sessionData.dt_start);
  //     sessionData.dt_created = util.convertUTCStringToDate(
  //       sessionData.dt_created
  //     );
  //     await setSession(sessionData);

  //     // Determine if session is expired
  //     setExpiredSession(new Date() > sessionData.dt_end);
  //     return res;
  //   } catch (err) {
  //     throw err;
  //   }
  // };

  /**
   * Change view for non-OK responses.
   * @param {object} res
   */
  const changeOtherSessionViews = (res) => {
    if (res.status == 401) {
      setOtherSessionResViews(<>Please log in</>);
    } else if (res.status == 403) {
      setOtherSessionResViews(<>Not invited</>);
    } else if (res.status == 404) {
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
    try {
      let res;
      // Get session time range data.
      res = await RequestHandler.req(
        `/timeranges?sessionid=${sessionId}`,
        "GET"
      );
      const data = await res.json();
      const timeRangeData = data.results;
      console.log("Time Range results:", timeRangeData);

      // Convert DT strings to dates
      timeRangeData.map((timeRange) => {
        timeRange.dt_created = util.convertUTCStringToDate(
          timeRange.dt_created
        );
        timeRange.dt_start = util.convertUTCStringToDate(timeRange.dt_start);
        timeRange.dt_end = util.convertUTCStringToDate(timeRange.dt_end);
      });

      setTimeRanges(timeRangeData);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Gets user sessions from api
   * @param {int} sessionId
   */
  const getUserSessions = async (sessionId) => {
    try {
      let res;
      // Get user sessions
      res = await RequestHandler.req(
        `/usersessions?sessionid=${sessionId}`,
        "GET"
      );
      const data = await res.json();
      const userSessionsData = data.userSessions;
      console.log("User session results:", userSessionsData);
      setUserSessions(userSessionsData);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div>
      {sessionResStatus === undefined && (
        <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
          <h1 className="text-accent-blue text-center">Please wait, loading your session...</h1>
        </Container> 
      )}
      {(sessionResStatus >= 200 && sessionResStatus <= 200) && (
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
          />

          <Container fluid>
            <Row className="justify-content-md-center">
              <Col sm={8}>
                <SessionInfo
                  session={session}
                  expiredSession={expiredSession}
                />
                <Button variant="primary" onClick={handleShowDt}>
                  Add DtRange
                </Button>
                <SessionChart
                  timeRanges={timeRanges}
                  setTimeRanges={setTimeRanges}
                  session={session}
                  userId={userId}
                />
                <Button variant="primary" onClick={handleShowDt}>
                  Add DtRange
                </Button>
              </Col>
              <Col sm={4}>
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
      {(sessionResStatus < 200 || sessionResStatus > 200) && (
        <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
          <h1 className="text-accent-red text-center">Sorry, unable to load your session at this time</h1>
          <p>Error: {sessionResStatus}</p>
        </Container>
      )}
      {otherSessionResViews}
    </div>
  );
};

export default Session;
