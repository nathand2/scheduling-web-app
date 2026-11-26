import { useEffect, useState } from "react";
import { useSearchParams, Navigate } from "react-router-dom";

import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";

import { RequestHandler } from "../js/requestHandler";
import type { JoinSessionResponse } from "../types";

type JoinState =
  | { status: "loading" }
  | { status: "success"; sessionCode: string }
  | { status: "notFound" }
  | { status: "error"; message: string };

interface SessionJoinProps {
  loggedIn: boolean | undefined;
}

const SessionJoin = ({ loggedIn }: SessionJoinProps) => {
  const [searchParams] = useSearchParams();
  const [joinState, setJoinState] = useState<JoinState>({ status: "loading" });
  const [redirectToSession, setRedirectToSession] = useState(false);
  const inviteCode = searchParams.get("code");
  // React Router expects an app-relative destination. Passing the absolute app
  // URL here makes it resolve under /login (for example /login/http:/...).
  const redirectUrl = `/sessionjoin?code=${encodeURIComponent(inviteCode || "")}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(redirectUrl)}`;

  useEffect(() => {
    let didCancel = false;
    let redirectTimer: number | undefined;

    if (loggedIn === undefined) return () => {};
    if (loggedIn === false) return () => {};

    const joinSession = async () => {
      if (!inviteCode) {
        setJoinState({ status: "error", message: "This invite link is missing its invite code." });
        return;
      }

      try {
        const res = await RequestHandler.req("/v1/joinsession", "POST", {
          inviteCode: { inviteCode },
        });

        if (didCancel) return;
        if (res.status === 404) {
          setJoinState({ status: "notFound" });
          return;
        }
        if (res.status < 200 || res.status > 299) {
          setJoinState({ status: "error", message: `We couldn't join this session (error ${res.status}). Please try again.` });
          return;
        }

        const data = (await res.json()) as JoinSessionResponse;
        if (didCancel) return;
        if (!data?.sessionCode) {
          setJoinState({ status: "error", message: "The invite was accepted, but we couldn't open the session. Please try again." });
          return;
        }

        setJoinState({ status: "success", sessionCode: data.sessionCode });
        redirectTimer = window.setTimeout(() => setRedirectToSession(true), 1200);
      } catch (err) {
        if (!didCancel) {
          setJoinState({ status: "error", message: "We couldn't connect to the server. Please check your connection and try again." });
        }
      }
    };

    if (loggedIn) joinSession();
    return () => {
      didCancel = true;
      window.clearTimeout(redirectTimer);
    };
  }, [loggedIn, inviteCode]);

  if (loggedIn === false) return <Navigate to={loginUrl} replace />;
  if (redirectToSession && joinState.status === "success") {
    return <Navigate to={`/session/${joinState.sessionCode}`} replace />;
  }

  const content = (() => {
    switch (joinState.status) {
      case "loading":
        return {
          title: "Checking your invite",
          message: "Please wait while we connect you to the session.",
        };
      case "success":
        return {
          title: "Success!",
          message: "You're in. Redirecting to your session…",
        };
      case "notFound":
        return {
          title: "Invite not found",
          message: "This invite link may have expired or been copied incorrectly. Ask the session host for a new invite.",
        };
      case "error":
        return {
      title: "Couldn't join the session",
          message: joinState.message,
        };
    }
  })();
  const status = joinState.status;

  return (
    <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: "80vh" }}>
      <Card className="shadow-sm border-0 text-center" style={{ width: "100%", maxWidth: "460px", borderRadius: "1rem" }}>
        <Card.Body className="p-4 p-md-5">
          {status === "loading" && <Spinner animation="border" variant="primary" className="mb-3" role="status" aria-label="Checking invite" />}
          {status === "success" && <div className="mb-3 text-success" aria-hidden="true" style={{ fontSize: "2.5rem", lineHeight: 1 }}>✓</div>}
          {status === "notFound" && <div className="mb-3 text-warning" aria-hidden="true" style={{ fontSize: "2.5rem", lineHeight: 1 }}>!</div>}
          {status === "error" && <div className="mb-3 text-danger" aria-hidden="true" style={{ fontSize: "2.5rem", lineHeight: 1 }}>×</div>}
          <h1 className="h3 text-accent-blue mb-3">{content.title}</h1>
          {status === "notFound" ? (
            <Alert variant="warning" className="mb-0">{content.message}</Alert>
          ) : (
            <p className={status === "error" ? "text-danger mb-0" : "text-muted mb-0"} role={status === "error" ? "alert" : "status"}>{content.message}</p>
          )}
          {(status === "error" || status === "notFound") && (
            <Button variant="outline-primary" className="mt-4" onClick={() => window.location.assign("/")}>Back to home</Button>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SessionJoin;
