import { useState, useEffect } from "react";
import { IoMdAddCircle } from "react-icons/io";

import { Link } from "react-router-dom";
import { Alert, Button, Card, Container, Spinner } from "react-bootstrap";
import SessionCard from "./SessionCard";

import { RequestHandler } from "../js/requestHandler";
const util = require("../js/util");

const Sessions = () => {
  const [sessions, setSessions] = useState(undefined);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Gets sessions
    let didCancel = false;
    const getSessions = async () => {
      try {
        const res = await RequestHandler.req(`/v1/sessions`, "GET");
        if (res.status < 200 || res.status > 299) {
          throw new Error(`Sessions request failed with status ${res.status}`);
        }
        const data = await res.json();
        if (didCancel) return;
        const sessionList = Array.isArray(data.sessions) ? data.sessions : [];
        sessionList.forEach((session) => {
          session.dt_created = util.convertUTCStringToDate(session.dt_created);
        });
        setSessions(sessionList);
      } catch (err) {
        console.error("Unable to load sessions:", err);
        if (!didCancel) setLoadError(true);
      }
    };
    getSessions();
    return () => {
      didCancel = true;
    };
  }, []);

  /**
   * Calculates Session Status
   * @param {string} dtStartString
   * @param {string} dtEndString
   * @returns string
   */
  const calculateSessionStatus = (dtStartString, dtEndString) => {
    const now = new Date();
    if (util.convertUTCStringToDate(dtEndString) < now) {
      return "Expired";
    } else if (util.convertUTCStringToDate(dtStartString) > now) {
      return "Upcoming";
    } else {
      return "Active";
    }
  };
  return (
    <Container className="py-4">
      <h1 className="text-accent-blue mb-4">Sessions</h1>
      {sessions === undefined && !loadError ? (
        <div className="sessions-loading" role="status" aria-live="polite">
          <Spinner animation="border" variant="primary" aria-hidden="true" />
          <div>
            <h2 className="h5 mb-1">Loading your sessions</h2>
            <p className="text-muted mb-0">This should only take a moment.</p>
          </div>
        </div>
      ) : loadError ? (
        <Alert variant="danger" className="sessions-message">
          <Alert.Heading>Sessions couldn't be loaded</Alert.Heading>
          <p className="mb-3">Please check your connection and try again.</p>
          <Button variant="outline-danger" onClick={() => window.location.reload()}>Try again</Button>
        </Alert>
      ) : (
        <>
          {sessions.length === 0 && (
            <Alert variant="light" className="sessions-message border text-center">
              <h2 className="h5">No sessions yet</h2>
              <p className="text-muted mb-0">Create a session to get started, or check back when someone invites you.</p>
            </Alert>
          )}
          <div className="sessions-grid">
            <Card className="session-create-card text-center" bg="light" text="primary">
              <Link to="/sessioncreate" className="link-plain card-link">
                <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                  <IoMdAddCircle className="large-icon mb-2" aria-hidden="true" />
                  <Card.Text className="mb-0">Create a Session</Card.Text>
                </Card.Body>
              </Link>
            </Card>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                code={session.code}
                title={session.session_title}
                desc={session.session_desc}
                dt_created={session.dt_created.toLocaleString()}
                status={calculateSessionStatus(session.dt_start, session.dt_end)}
              />
            ))}
          </div>
        </>
      )}
    </Container>
  );
};

export default Sessions;
