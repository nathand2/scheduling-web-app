import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import { io } from "socket.io-client";

import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Flatpickr from "react-flatpickr";

import SessionHeader from "./SessionHeader";
import SessionInfo from "./SessionInfo";
import SessionShareModal from "./SessionShareModal";
import SessionChart from "./SessionChart";
import SessionAttendence from "./SessionAttendence";

import { RequestHandler } from "../js/requestHandler";
const util = require("../js/util");

const ENDPOINT = "ws://localhost:6500/";

const Session = () => {
  
  const [params, setParams] = useState(useParams());
  const [session, setSession] = useState("");
  const [timeRanges, setTimeRanges] = useState([]);
  const [userSessions, setUserSessions] = useState([]);
  const [showDtModal, setShowDtModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [expiredSession, setExpiredSession] = useState(undefined);
  const [sessionResStatus, setSessionResStatus] = useState();
  const [otherSessionResViews, setOtherSessionResViews] = useState();

  const [dtStatus, setDtStatus] = useState("going");
  const [dtStart, setdtStart] = useState(new Date());
  const [dtEnd, setdtEnd] = useState(
    new Date(new Date().getTime() + 60 * 60 * 2 * 1000)
  );

  const dtOptionsConfig = {
    minuteIncrement: 1,
  };

  let didCancel = false;
  useEffect(() => {
    const getSessionData = async () => {
      if (!didCancel) {
        didCancel = true
        // Get session data from api
        try {
          const res = await getSession();
          const sessionData = res.data.session;
          if (res.status !== 200) {
            changeOtherSessionViews(res);
            return;
          }
          await getTimeRanges(sessionData.id);
          await getUserSessions(sessionData.id);
          await setUpWebSocketConnection(sessionData.code);
        } catch (err) {
          console.log("Error:", err);
        }
      }
    };

    console.log("useEffect once?")
    getSessionData();
  }, []);

  const setUpWebSocketConnection = async (code) => {
    // Connect to web socket if session.code not undefined
    if (code !== undefined) {
      console.log("Setting up websocket conn")
      const socket = io('http://localhost:8000')
      socket.on('connect', function() {
        socket.emit('room', code);
      });
  
      socket.on('connect_error', ()=>{
        setTimeout(()=>socket.connect(), 5000)
      });
  
      socket.on('connect', function() {
        // Connected, let's sign-up for to receive messages for this room
        socket.emit('room', code);
      });
      
      socket.on('message', function(data) {
          console.log('Incoming message:', data);
      });
      
      socket.on('joinSession', function(data) {
          console.log('New user joined!:', data);
          setUserSessions((prev) => {
            return [...prev, data]
          });
      });
      
      socket.on('postDtRange', async function(data) {
        // Adds new range to timeRanges state.
          setTimeRanges((prev) => {
            return [...prev, data.data]
          });
      });
    }
  }

  const handleCloseDt = () => setShowDtModal(false);
  const handleShowDt = () => setShowDtModal(true);

  const handleCloseShare = () => {
    setShowShareModal(false);
  };
  const handleShowShare = () => {
    setShowShareModal(true);
  };

  const submitDtRange = () => {
    handleCloseDt();
    addDtRange();
  };

  const getSession = async () => {
    try {
      let res;
      res = await RequestHandler.req(`/session/${params.code}`, "GET");
      setSessionResStatus(res.status);

      const sessionData = res.data.session;

      sessionData.dt_end = util.mySqlDtToJsDate(sessionData.dt_end);
      sessionData.dt_start = util.mySqlDtToJsDate(sessionData.dt_start);
      sessionData.dt_created = util.mySqlDtToJsDate(sessionData.dt_created);
      await setSession(sessionData);

      // Determine if session is expired
      setExpiredSession(new Date() > sessionData.dt_end);
      return res;
    } catch (err) {
      throw err;
    }
  };

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

  const getTimeRanges = async (sessionId) => {
    try {
      let res;
      // Get session time range data.
      res = await RequestHandler.req(
        `/timeranges?sessionid=${sessionId}`,
        "GET"
      );
      const timeRangeData = res.data.results;
      console.log("Time Range results:", timeRangeData);
      setTimeRanges(timeRangeData);
    } catch (err) {
      throw err;
    }
  };

  const getUserSessions = async (sessionId, res) => {
    try {
      let res;
      // Get user sessions
      res = await RequestHandler.req(
        `/usersessions?sessionid=${sessionId}`,
        "GET"
      );
      const userSessionsData = res.data.userSessions;
      console.log("User session results:", userSessionsData);
      setUserSessions(userSessionsData);
    } catch (err) {
      throw err;
    }
  };

  const addDtRange = async () => {
    try {
      // Check for valid dt range
      if (new Date(dtStart) > new Date(dtEnd)) {
        console.log("Invalid dt range.");
        throw new Error("Invalid dt Range");
      }

      console.log("Date type:", String(typeof dtStart));
      console.log("Session: ", session);
      console.log("Body:", {
        sessionId: session.id,
        dtStart: dtStart,
        dtEnd: dtEnd,
        status: dtStatus,
      });
      let res;
      res = await RequestHandler.req("/sessiontimerange", "POST", {
        sessionId: session.id,
        sessionCode: session.code,
        dtStart: dtStart,
        dtEnd: dtEnd,
        status: dtStatus,
      });
      if (res.status !== 200) return;
      const resData = res.data;
      console.log("Res:", res);
      const insertId = resData.insertId;
      console.log("Inserted dtRange with insertId:", insertId);
    } catch (err) {
      console.log("Error:", err);
      return;
    }
  };

  return (
    <div>
      {sessionResStatus === undefined && <>loading session</>}
      {sessionResStatus === 200 && (
        <>
          <SessionHeader showShareModal={handleShowShare} />
          <SessionShareModal
            show={showShareModal}
            onHide={handleCloseShare}
            handleClose={handleCloseShare}
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
                <SessionChart timeRanges={timeRanges} session={session} />
                <Button variant="primary" onClick={handleShowDt}>
                  Add DtRange
                </Button>
                <Container className="d-flex flex-column dev-info uncenter-content">
                  Session Status: {expiredSession ? <>Expired</> : <>Ongoing</>}
                  <br />
                  {JSON.stringify(session)}
                  <br />
                  showShareModal:{showShareModal ? "true" : "false"}
                  <br />
                  Session
                  <br />
                </Container>
              </Col>
              <Col sm={4}>
                <SessionAttendence userSessions={userSessions} />
              </Col>
            </Row>
          </Container>

          <>
            <Modal show={showDtModal} onHide={handleCloseDt}>
              <Modal.Header closeButton>
                <Modal.Title>Add Date Time Range</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                Start &nbsp;
                <Flatpickr
                  data-enable-time
                  value={dtStart}
                  onChange={(dt) => {
                    setdtStart(dt);
                  }}
                />
                <br />
                End &nbsp;
                <Flatpickr
                  data-enable-time
                  value={dtEnd}
                  onChange={(dt) => {
                    setdtEnd(dt);
                  }}
                  options={{
                    ...dtOptionsConfig,
                    minDate: dtStart,
                  }}
                />
                <Form.Group className="mb-3">
                  <Form.Label>Who can attend my Session? &nbsp;</Form.Label>
                  <Form.Select
                    aria-label="Default select example"
                    value={dtStatus}
                    onChange={(e) => setDtStatus(e.target.value)}
                  >
                    <option value="going">Going 👍</option>
                    <option value="maybe">Maybe 🤷‍♂️</option>
                  </Form.Select>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseDt}>
                  Close
                </Button>
                <Button variant="primary" onClick={submitDtRange}>
                  Submit
                </Button>
              </Modal.Footer>
            </Modal>
          </>

          <br />
        </>
      )}
      {otherSessionResViews}
    </div>
  );
};

export default Session;
