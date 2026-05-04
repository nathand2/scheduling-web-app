import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Flatpickr from "react-flatpickr";
import Form from "react-bootstrap/Form";

import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { RequestHandler } from "../js/requestHandler";

const SessionAddRangeModal = ({ handleClose, show, session }) => {

  const [dtStatus, setDtStatus] = useState("going");
  const [dtStart, setdtStart] = useState(new Date());
  const [dtEnd, setdtEnd] = useState(
    new Date(new Date().getTime() + 60 * 60 * 2 * 1000)
  );
  const [isCreateRangeLoading, setIsCreateRangeLoading] = useState(false);
  
  const dtOptionsConfig = {
    minuteIncrement: 1,
    dateFormat: "M d Y h:m K",
  };

  /**
   * Adds datetime range with POST request
   * @returns undefined
   */
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
      setIsCreateRangeLoading(true);
      let res;
      res = await RequestHandler.req("/sessiontimerange", "POST", {
        sessionId: session.id,
        sessionCode: session.code,
        dtStart: dtStart,
        dtEnd: dtEnd,
        status: dtStatus,
      });
      setIsCreateRangeLoading(false);

      if (res.status !== 200) return;
      
      handleClose();
      
      const resData = await res.json();
      console.log("Res:", res);
      const insertId = resData.insertId;
      console.log("Inserted dtRange with insertId:", insertId);
    } catch (err) {
      console.log("Error:", err);
      return;
    }
  };

  /**
   * Handle Submit
   */
  const submitDtRange = () => {
    addDtRange();
  };

  return (
    <div>
      <Modal show={show} onHide={handleClose}>
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
            options={{
              ...dtOptionsConfig,
              minDate: dtStart,
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
          <Button variant="secondary" style={{ minWidth: "80px" }} onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" type="submit" style={{ minWidth: "80px" }} onClick={submitDtRange}>
            {
              !isCreateRangeLoading ? <>Submit</> : <AiOutlineLoading3Quarters className="spin" />
            }
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SessionAddRangeModal;
