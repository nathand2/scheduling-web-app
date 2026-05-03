import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

import { IoMdLink } from "react-icons/io";

import { RequestHandler } from "../js/requestHandler";

const SessionShareModal = ({ handleClose, show }) => {
  
  const [params, setParams] = useState(useParams());
  // const [inviteLink, setInviteLink] = useState(undefined);

  // useEffect(() => {
  //   let res;
  //   try {
  //      res = await RequestHandler.req(
  //       `/sessioninvite?code=${params.code}`,
  //       "GET"
  //     );
  //     const results = await res.json();
  //     console.log("Got invite code:", results);
  //     console.log(
  //       RequestHandler.endpointRoot + "/sessionjoin?code=" + results.inviteCode
  //     );

  //     setInviteLink(RequestHandler.appRoot + "/sessionjoin?code=" + results.inviteCode);

  //   } catch (err) {
  //     console.log("Error:", err);
  //   }
  // }, [])

  /**
   * Creates a POST request to generate a invite link (for owners)
   * @returns undefined
   */
  const shareWithLink = async () => {
    let res;
    try {
       res = await RequestHandler.req("/sessioninvite", "POST", {
        sessionCode: params.code,
      });
      if (res.status != 200) {
        console.log("You can't create a share link. You are not an owner.")
        return;
      }
      const results = await res.json();
      console.log("Created session invite:", results);
      console.log(
        RequestHandler.appRoot + "/sessionjoin?code=" + results.inviteCode
      );

      const inviteLink = RequestHandler.appRoot + "/sessionjoin?code=" + results.inviteCode

      /* Copy the text inside the text field */
      navigator.clipboard.writeText(inviteLink);
      console.log("Share link copied to clipboard")

    } catch (err) {
      console.log("Error:", err);
    }
  };

  /**
   * Gets share link with GET request if one already exists (for attendees)
   */
  const getShareLink = async () => {
    let res;
    try {
       res = await RequestHandler.req(
        `/sessioninvite?code=${params.code}`,
        "GET"
      );

      // If no invite code exists, create one
      if (res.status === 404) {
        res = await RequestHandler.req("/sessioninvite", "POST", {
          sessionCode: params.code,
        });
      }

      if (res.status < 200 && res.status > 299) {
        console.log("Error, could not retrieve invite code ", `[${res.status}]`);
        return;
      }

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
          {/* <p className="text-underline" onClick={shareWithLink}>Copy Link (Owners Only)</p> */}
          {/* <p className="text-underline" onClick={getShareLink}>Get Link</p> */}
          <Button variant="primary" onClick={getShareLink} className="d-flex align-items-center gap-2">
            <IoMdLink />
            <span>Get Link</span>
          </Button>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  )
}

export default SessionShareModal