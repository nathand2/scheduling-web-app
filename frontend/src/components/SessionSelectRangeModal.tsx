import { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { RequestHandler } from "../js/requestHandler";
import dayjs from "dayjs";
import type { AvailabilityRange, SessionRecord } from "../types";

interface SessionSelectRangeModalProps {
  handleClose: () => void;
  onDeleted?: () => void;
  show: boolean;
  range?: AvailabilityRange;
  session: SessionRecord;
  userId?: string | number;
  onDeleteRange?: (range: AvailabilityRange) => void;
}

const SessionSelectRangeModal = ({ handleClose, onDeleted, onDeleteRange, show, range, session, userId }: SessionSelectRangeModalProps) => {
  const [warning, setWarning] = useState("");
  const [warningClass, setWarningClass] = useState("text-warning");
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    try {
      if (range === undefined) return;
      setShowDelete(range.user_id === userId);
    } catch (err) {
      console.log(err);
    }
  }, [range, userId]);

  /**
   * Deletes range with DELETE request
   */
  const deleteRange = async () => {
    if (!range) return;
    try {
      setIsDeleteLoading(true);
      if (onDeleteRange) {
        onDeleteRange(range);
        setShowDelete(false);
        handleClose();
        onDeleted?.();
        return;
      }
      const res = await RequestHandler.req("/v1/sessiontimerange", "DELETE", {
        sessionTimeRangeId: range.id,
        userSessionId: range.user_session_id,
        sessionCode: session.code,
      });
      if (res.status === 204) {
        setShowDelete(false);
        handleClose();
        onDeleted?.();
      } else if (res.status === 403) {
        setWarningClass("text-warning");
        setWarning("Unable to delete range. You did not create it");
      } else {
        setWarningClass("text-warning");
        setWarning("Error: Could not delete range");
      }
    } catch (err) {
      console.log(err);
      setWarningClass("text-warning");
      setWarning("Error: Could not delete range");
    } finally {
      setIsDeleteLoading(false);
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
              <h5>Created By:&nbsp;{range.display_name}</h5>
              <p>Status:&nbsp;{range.status}</p>
              <p>
                {`${dayjs(range.dt_start).toDate().toLocaleTimeString()} - ${dayjs(range.dt_end).toDate().toLocaleTimeString()}`}
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
