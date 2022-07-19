import { useEffect, useState } from "react";
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

const webSocketEndpoint = "http://localhost:6500";

const Session = () => {
  
  const [params, setParams] = useState(useParams());
  const [session, setSession] = useState("");
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
      const socket = io(webSocketEndpoint)
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
          setToastTitle(`Someone joined!`)
          setToastMessage(`${data.display_name} joined the session!`)
          setShowToast(true)
      });
      
      socket.on('postDtRange', async function(data) {
        // Convert UTC date strings to dates
        data.dt_end = util.convertUTCStringToDate(data.dt_end);
        data.dt_start = util.convertUTCStringToDate(data.dt_start);
        data.dt_created = util.convertUTCStringToDate(data.dt_created);

        // Adds new range to timeRanges state.
          setTimeRanges((prev) => {
            return [...prev, data]
          });
          if (data.user_id === parseInt(localStorage.userId)) {
            setToastTitle(`Thanks for joining!`)
            setToastMessage(`We'll let everyone here know`)
            setShowToast(true)
          } else {
            setToastTitle(`Good News!`)
            setToastMessage(`${data.display_name} is ${(data.status === 'maybe') ? 'maybe ' : ""}coming!`)
            setShowToast(true)
          }
      });
      socket.on('deleteTimeRange', function(data) {
        console.log('Someone deleted timerange!:', data);
        setTimeRanges((prev) => {
          return prev.filter(range => range.id !== data.sessionTimeRangeId)
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

  const getSession = async () => {
    try {
      let res;
      res = await RequestHandler.req(`/session/${params.code}`, "GET");
      setSessionResStatus(res.status);

      const sessionData = res.data.session;

      sessionData.dt_end = util.convertUTCStringToDate(sessionData.dt_end);
      sessionData.dt_start = util.convertUTCStringToDate(sessionData.dt_start);
      sessionData.dt_created = util.convertUTCStringToDate(sessionData.dt_created);
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

      // Convert DT strings to dates
      timeRangeData.map((timeRange) => {
        timeRange.dt_created = util.convertUTCStringToDate(timeRange.dt_created)
        timeRange.dt_start = util.convertUTCStringToDate(timeRange.dt_start)
        timeRange.dt_end = util.convertUTCStringToDate(timeRange.dt_end)
      })
      
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

  return (
    <div>
      {sessionResStatus === undefined && <>loading session</>}
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
                <SessionChart timeRanges={timeRanges} setTimeRanges={setTimeRanges} session={session} />
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
          {
            showToast && 
            <SessionToast title={toastTitle} message={toastMessage} show={showToast} setShow={setShowToast}/>
          }

          <br />
        </>
      )}
      {otherSessionResViews}
    </div>
  );
};

export default Session;
