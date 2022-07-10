import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Flatpickr from "react-flatpickr";

import SessionHeader from "./SessionHeader";
import SessionShareModal from "./SessionShareModal";
import SessionChart from "./SessionChart";
import SessionAttendence from "./SessionAttendence";

import { RequestHandler } from "../js/requestHandler";
const util = require("../js/util");

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

  useEffect(() => {
    let didCancel = false;
    const getSessionData = async () => {
      if (!didCancel) {
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
        } catch (err) {
          console.log("Error:", err);
        }
      }
    };
    getSessionData();
  }, []);

  const handleCloseDt = () => setShowDtModal(false);
  const handleShowDt = () => setShowDtModal(true);

  const handleCloseShare = () => {
    setShowShareModal(false);
  };
  const handleShowShare = () => {
    console.log("Trying to show share");
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

      console.log("Res with status:", res.status);
      setSessionResStatus(res.status);

      const sessionData = res.data.session;

      console.log("Res data:", res);
      sessionData.dt_end = util.mySqlDtToJsDate(sessionData.dt_end)
      sessionData.dt_start = util.mySqlDtToJsDate(sessionData.dt_start)
      sessionData.dt_created = util.mySqlDtToJsDate(sessionData.dt_created)
      await setSession(sessionData);

      // Determine if session is expired
      setExpiredSession(new Date() > sessionData.dt_end);
      console.log("Session?:", sessionData);
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
      console.log("Res:", res);
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
      setUserSessions(userSessionsData)
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
      console.log("Session:", session);
      console.log("Body:", {
        sessionId: session.id,
        dtStart: dtStart,
        dtEnd: dtEnd,
        status: dtStatus,
      });
      let res;
      res = await RequestHandler.req("/sessiontimerange", "POST", {
        sessionId: session.id,
        dtStart: dtStart,
        dtEnd: dtEnd,
        status: dtStatus,
      });
      const resData = res.data;
      console.log("Res:", res)
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
          <Row>
            <Col sm={8}>
              {/* <canvas className="session-canvas" ></canvas> */}
              <SessionChart timeRanges={ timeRanges } session={ session } />
              <br />
              Session Status: {expiredSession ? <>Expired</> : <>Ongoing</>}
              <br />
              {JSON.stringify(session)}
              <br />
              Time Ranges:
              <br />
              {timeRanges.map((range) => (
                <>
                  {JSON.stringify(range)}
                  <br />
                </>
              ))}
              showShareModal:{showShareModal ? "true" : "false"}
              <br />
              Session
              <br />
              <Button variant="primary" onClick={handleShowDt}>
                Add DtRange
              </Button>
              
            </Col>
            <Col sm={4}>
              <SessionAttendence userSessions={ userSessions } />
            </Col>
          </Row>

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
