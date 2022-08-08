import React from "react";
import Container from "react-bootstrap/Container";
import Badge from "react-bootstrap/Badge";

const SessionInfo = ({ session, expiredSession }) => {
  return (
    <div>
      <Container fluid className="uncenter-content">
        <h1>{session.session_title}</h1>
        <h6>
          {expiredSession ? (
            <Badge bg="secondary">Expired</Badge>
          ) : (
            <Badge bg="primary">Ongoing</Badge>
          )}
        </h6>
        {session.session_desc && <h5>{session.session_desc}</h5>}
        <div className="flex-row">
          <p style={{ fontSize: 12 }}>
            Created {session.dt_created.toLocaleString()}
          </p>
        </div>
      </Container>
    </div>
  );
};

export default SessionInfo;
