import { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { RequestHandler } from "../js/requestHandler";

const SessionSelectRangeModal = ({ handleClose, show, range, session }) => {
  const [warning, setWarning] = useState("");
  const [warningClass, setWarningClass] = useState("text-warning");
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    try {
      if (range === undefined) return;
      setShowDelete(range.user_id === parseInt(localStorage.userId));
    } catch (err) {
      console.log(err);
    }
  }, [range]);

  /**
   * Deletes range with DELETE request
   */
  const deleteRange = async () => {
    try {
      setIsDeleteLoading(true);
      const res = await RequestHandler.req("/v1/sessiontimerange", "DELETE", {
        sessionTimeRangeId: range.id,
        userSessionId: range.user_session_id,
        sessionCode: session.code,
      });
      setIsDeleteLoading(false);
      if (res.status === 204) {
        setShowDelete(false);
        setWarningClass("text-success");
        setWarning("Successfully deleted time range");
      } else if (res.status === 403) {
        setWarningClass("text-warning");
        setWarning("Unable to delete range. You did not create it");
      } else {
        setWarningClass("text-warning");
        setWarning("Error: Could not delete range");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const dismissModal = () => {
    try {
      setWarning("");
      handleClose();
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div>
      <Modal show={show} onHide={dismissModal}>
        {range !== undefined ? (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Edit Range</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h5 size="sm">Created By:&nbsp;{range.display_name}</h5>
              <p size="sm">Status:&nbsp;{range.status}</p>
              <p size="sm">
                {`${range.dt_start.toLocaleTimeString()} - ${range.dt_end.toLocaleTimeString()}`}
              </p>
              {/* {JSON.stringify(range)} */}
            </Modal.Body>
            <Modal.Footer>
              <p className={warningClass}>{warning}</p>
              {showDelete && (
                // <Button variant="danger" onClick={deleteRange}>
                //   Delete
                // </Button>
                <Button variant="danger" onClick={deleteRange} style={{ minWidth: "80px" }}>
                {
                  !isDeleteLoading ? <>Delete</> : <AiOutlineLoading3Quarters className="spin" />
                }
            </Button>
              )}
              <Button variant="primary" onClick={dismissModal} style={{ minWidth: "80px" }}>
                Done
              </Button>
            </Modal.Footer>
          </>
        ) : (
          <>"Loading range..."</>
        )}
      </Modal>
    </div>
  );
};

export default SessionSelectRangeModal;
