import React from 'react'
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const SessionSelectRangeModal = ({ handleClose, show, range }) => {
  return (
    <div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Stuff
          {
            JSON.stringify(range)
          }
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

export default SessionSelectRangeModal