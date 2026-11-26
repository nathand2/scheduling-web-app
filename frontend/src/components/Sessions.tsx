import { useState, useEffect } from "react";
import { IoMdAddCircle } from "react-icons/io";

import { Link } from "react-router-dom";
import { Alert, Button, Card, Container, Spinner } from "react-bootstrap";
import SessionCard from "./SessionCard";

import { RequestHandler } from "../js/requestHandler";
import * as util from "../js/util";
import type { SessionListResponse, SessionStatus, SessionSummary } from "../types";

const Sessions = () => {
  const [sessions, setSessions] = useState<SessionSummary[] | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const sessionList = sessions ?? [];

  useEffect(() => {
    // Gets sessions
    let didCancel = false;
    const getSessions = async () => {
      try {
        const res = await RequestHandler.req(`/v1/sessions`, "GET");
        if (res.status < 200 || res.status > 299) {
          throw new Error(`Sessions request failed with status ${res.status}`);
        }
        const data = (await res.json()) as Partial<SessionListResponse>;
        if (didCancel) return;
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
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
  const calculateSessionStatus = (dtStart: Date | string, dtEnd: Date | string): SessionStatus => {
    const now = new Date();
    const start = dtStart instanceof Date ? dtStart : util.convertUTCStringToDate(dtStart);
    const end = dtEnd instanceof Date ? dtEnd : util.convertUTCStringToDate(dtEnd);
    if (end < now) {
      return "Expired";
    } else if (start > now) {
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
          {sessionList.length === 0 && (
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
            {sessionList.map((session) => (
              <SessionCard
                key={session.id}
                code={session.code}
                title={session.session_title}
                desc={session.session_desc}
                dt_created={(session.dt_created instanceof Date ? session.dt_created : util.convertUTCStringToDate(session.dt_created)).toLocaleString()}
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
