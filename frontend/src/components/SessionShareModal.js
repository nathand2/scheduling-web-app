import { useState } from "react";
import { useParams } from "react-router-dom";

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import { IoMdLink } from "react-icons/io";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { RequestHandler } from "../js/requestHandler";

const SessionShareModal = ({ handleClose, show }) => {
  
  const [params] = useState(useParams());
  const [isGetInviteLinkLoading, setIsGetInviteLinkLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [statusTextClassName, setStatusTextClassName] = useState('text-success');

  const dismissModal = () => {
    setStatusText("");
    handleClose();
  }

  /**
   * Gets share link with GET request if one already exists (for attendees)
   */
  const getShareLink = async () => {
    setIsGetInviteLinkLoading(true);
    let res;
    try {
       res = await RequestHandler.req(
        `/v1/sessioninvite?code=${params.code}`,
        "GET"
      );
      setIsGetInviteLinkLoading(false);

      // If no invite code exists, create one
      if (res.status === 404) {
        res = await RequestHandler.req("/v1/sessioninvite", "POST", {
          sessionCode: params.code,
        });
      }

      if (res.status < 200 && res.status > 299) {
        setStatusTextClassName("text-danger");
        setStatusText(`Error: Unable to get share link [${res.status}]`);
        return;
      }
      setStatusTextClassName("text-success");
      setStatusText(`Share link copied to clipboard!`);

      const results = await res.json();
      console.log("Got invite code:", results);
      console.log(
        RequestHandler.endpointRoot + "/sessionjoin?code=" + results.inviteCode
      );

      const inviteLink = RequestHandler.appRoot + "/sessionjoin?code=" + results.inviteCode

      /* Copy the text inside the text field */
      navigator.clipboard.writeText(inviteLink);
      console.log("Share link copied to clipboard")
    } catch (err) {
      console.log("Error:", err);
    }
  };

  return (
    <div>
    <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Share Session</Modal.Title>
        </Modal.Header>
        {/* <Modal.Body>
          Share with group (coming soon)
        </Modal.Body> */}
        <Modal.Body>
          Share With Link
          <br />
          <div className="d-flex align-items-center gap-2">
            <Button variant="primary" onClick={getShareLink} className="d-flex align-items-center gap-2">
              <IoMdLink />
              <span>Get Link</span>
            </Button>
            {
              isGetInviteLinkLoading && <AiOutlineLoading3Quarters className="spin" />
            }
            <span className={statusTextClassName}>{statusText}</span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={dismissModal}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  )
}

export default SessionShareModal