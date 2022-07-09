import React from 'react'

import Container from "react-bootstrap/Container";
import ListGroup from "react-bootstrap/ListGroup";

const SessionAttendence = ({ userSessions }) => {
  return (
    <div>
      <Container>

      <h3>Attendees</h3>
      <ListGroup >
        {
          userSessions.map((userSession) => 
            (
            <>
              <ListGroup.Item key={userSession.id}>{userSession.display_name}</ListGroup.Item>
            </>
            )
          )
        }
      </ListGroup>
      </Container>
    </div>
  )
}

export default SessionAttendence