import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { RequestHandler } from "../js/requestHandler";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form"
import Flatpickr from "react-flatpickr";

const Session = () => {
  const [params, setParams] = useState(useParams());
  const [session, setSession] = useState("");
  const [showDtModal, setShowDtModal] = useState(false);
  const [dtStatus, setDtStatus] = useState('going');
  
  const [dtStart, setdtStart] = useState(new Date())
  const [dtEnd, setdtEnd] = useState(new Date(new Date().getTime() + 60 * 60 * 2 * 1000))

  const handleClose = () => setShowDtModal(false);
  const handleShow = () => setShowDtModal(true);
  const submitDtRange = () => {
    handleClose()
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
        console.log("Hello world");
        try {
          const data = await RequestHandler.req(
            `/session/${params.code}`,
            "GET"
          );
          console.log("Res data:", data);
          setSession(data.session);
        } catch (err) {
          console.log("Error:", err);
        }
      }
    };
    getSession();
  }, []);

  const shareWithLink = async () => {
    try {
      const results = await RequestHandler.req("/sessioninvite", "POST", {
        sessionCode: params.code,
      });
      console.log("Created session invite:", results);
      console.log(
        "http://localhost:3000/sessionjoin?code=" + results.inviteCode
      );
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const getShareLink = async () => {
    try {
      const results = await RequestHandler.req(
        `/sessioninvite?code=${params.code}`,
        "GET"
      );
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
      const resData = await RequestHandler.req("/sessiontimerange", "POST", {
        sessionId: session.id,
        dtStart: dtStart,
        dtEnd: dtEnd,
        status: dtStatus
      });
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
      Session
      <br />
      <Button onClick={shareWithLink}>Share with link</Button>
      <br />
      <Button onClick={getShareLink}>Get Share Link</Button>
      <br />
      {/* <Button onClick={showDtModal}>Add DtRange</Button>
      <br /> */}
      <>
        <Button variant="primary" onClick={handleShow}>
        Add DtRange
        </Button>

        <Modal show={showDtModal} onHide={handleClose}>
        
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
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={submitDtRange}>
              Submit
            </Button>
          </Modal.Footer>
        </Modal>
      </>
      <br />
      {JSON.stringify(session)}
    </div>
  );
};

export default Session;
