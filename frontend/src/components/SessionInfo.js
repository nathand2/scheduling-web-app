import React from 'react'
import { Container } from 'react-bootstrap'

const SessionInfo = ({ session }) => {
  return (
    <div>
      <Container >
        <h1 >{session.session_title}</h1>
        {
          session.session_desc && (
            <h5>{session.session_desc}</h5>
          )
        }
        <h6 className="float-sm-right">Created {session.dt_created.toLocaleString()}</h6>
      </Container>
    </div>
  )
}

export default SessionInfo