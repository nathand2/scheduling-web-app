import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form"
import Flatpickr from "react-flatpickr";

import SessionHeader from './SessionHeader'
import SessionShareModal from './SessionShareModal'

import { RequestHandler } from "../js/requestHandler";
const util = require("../js/util");

const Session = () => {
  const [params, setParams] = useState(useParams());
  const [session, setSession] = useState("");
  const [timeRanges, setTimeRanges] = useState([]);
  const [showDtModal, setShowDtModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [expiredSession, setExpiredSession] = useState(undefined)

  const [dtStatus, setDtStatus] = useState('going');
  const [dtStart, setdtStart] = useState(new Date())
  const [dtEnd, setdtEnd] = useState(new Date(new Date().getTime() + 60 * 60 * 2 * 1000))

  const handleCloseDt = () => setShowDtModal(false);
  const handleShowDt = () => setShowDtModal(true);

  
  const handleCloseShare = () => {
    setShowShareModal(false);
  }
  const handleShowShare = () => {
    console.log("Trying to show share")
    setShowShareModal(true);
  }

  const closeShare = () => {
    handleCloseShare()
    addDtRange()
  }

  const submitDtRange = () => {
    handleCloseDt()
    addDtRange()
  }

  const dtOptionsConfig = {
    minuteIncrement: 5,
  }

  useEffect(() => {
    let didCancel = false;
    const getSession = async () => {
      if (!didCancel) {
        // Get session data from api
        let data, status, res;
        try {
          res = await RequestHandler.req(
            `/session/${params.code}`,
            "GET"
          );

          const sessionData = res.data.session

          console.log("Res data:", res);

          // sessionData.dt_start = util.mySqlDtToJsDate(sessionData.dt_start)
          // sessionData.dt_end = util.mySqlDtToJsDate(sessionData.dt_end)
          
          await setSession(sessionData);

          // Determine if session is expired
          setExpiredSession(new Date() > util.mySqlDtToJsDate(sessionData.dt_end))
          console.log("Session?:", sessionData)

          // Get session time range data.
          res = await RequestHandler.req(
            `/timeranges?sessionid=${sessionData.id}`,
            "GET"
          );
          const timeRangeData = res.data.results
          console.log("Time Range results:", timeRangeData)
          setTimeRanges(timeRangeData)
        } catch (err) {
          console.log("Error:", err);
        }
      }
    };
    getSession();
  }, []);

  const shareWithLink = async () => {
    let data, status, res;
    try {
       res = await RequestHandler.req("/sessioninvite", "POST", {
        sessionCode: params.code,
      });
      const results = res.data
      console.log("Created session invite:", results);
      console.log(
        "http://localhost:3000/sessionjoin?code=" + results.inviteCode
      );
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const getShareLink = async () => {
    let data, status, res;
    try {
       res = await RequestHandler.req(
        `/sessioninvite?code=${params.code}`,
        "GET"
      );
      const results = res.data
      console.log("Got invite code:", results);
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const addDtRange = async () => {
    try {
      // Check for valid dt range
      if (new Date(dtStart) > new Date(dtEnd)) {
        console.log("Invalid dt range.");
        throw new Error("Invalid dt Range");
      }


      console.log("Date type:", String(typeof(dtStart)))
      console.log("Session:", session)
      console.log("Body:", {
        sessionId: session.id,
        dtStart: dtStart,
        dtEnd: dtEnd,
        status: dtStatus
      })
      let data, status, res;
       res = await RequestHandler.req("/sessiontimerange", "POST", {
        sessionId: session.id,
        dtStart: dtStart,
        dtEnd: dtEnd,
        status: dtStatus
      });
      const resData = res.data
      const insertId = resData.insertId;
      console.log("Inserted dtRange with insertId:", insertId);
    } catch (err) {
      console.log("Error:", err);
      return;
    }
  };

  // let params = useParams()
  return (
    <div>
      <SessionHeader showShareModal={handleShowShare} />
      <SessionShareModal show={showShareModal} onHide={handleCloseShare} handleClose={handleCloseShare} />
      showShareModal:{showShareModal ? "true" : "false"}<br />
      Session
      <br />
      <Button onClick={shareWithLink}>Share with link</Button>
      <br />
      <Button onClick={getShareLink}>Get Share Link</Button>
      <br />
      {/* <Button onClick={showDtModal}>Add DtRange</Button>
      <br /> */}
      <>
        <Button variant="primary" onClick={handleShowDt}>
        Add DtRange
        </Button>

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
      Session Status: {expiredSession ? <>Expired</> : <>Ongoing</>}
      <br />
      {JSON.stringify(session)}
      <br />
      Time Ranges:
      <br />
      {
        timeRanges.map(
          (range) => (
            <>{JSON.stringify(range)}
            <br /></>
          )
        )
      }
    </div>
  );
};

export default Session;
