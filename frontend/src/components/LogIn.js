import { useSearchParams, Navigate } from "react-router-dom";
import { RequestHandler } from "../js/requestHandler";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";

const LogIn = ({ onLoginSuccess }) => {
  const googleAuthEndpoint = RequestHandler.endpointRoot + "/v2/auth/google";

  const [searchParams] = useSearchParams();
  const [userName, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [statusText, setStatusText] = useState("");
  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false);

  const userNameLogIn = async (event) => {
    event.preventDefault();
    setStatusText("");

    const body = { username: userName, password: password };

    try {
      const res = await RequestHandler.req("/v2/auth/login", "POST", body);

      if (res.status === 200) {
        const data = await res.json();
        // Set sessionStorage so RequestHandler can use token immediately
        window.sessionStorage.setItem("accessToken", data.accessToken);
        // Lift state up to App
        onLoginSuccess(data);
        setIsLoginSuccessful(true);
      } else if (res.status === 401) {
        setStatusText("Invalid username or password.");
      } else if (res.status === 400) {
        setStatusText("Please enter a username and password.");
      } else {
        setStatusText("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.log(err);
      setStatusText(`Unable to log in at this time. [${err}]`);
    }
  };

  return (
    <div>
      {isLoginSuccessful && (
        <Navigate to={searchParams.get("redirect") || "/"} />
      )}
      <br />
      <div className="center-container">
        <Card className="auth-card">
          <br />
          <Form onSubmit={userNameLogIn}>
            <Form.Group as={Row} className="mb-3" controlId="formHorizontalUsername">
              <Form.Label column sm={2}>
                Username
              </Form.Label>
              <Col sm={10}>
                <Form.Control
                  type="text"
                  placeholder="Username"
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Col>
            </Form.Group>

            <Form.Group as={Row} className="mb-3" controlId="formHorizontalPassword">
              <Form.Label column sm={2}>
                Password
              </Form.Label>
              <Col sm={10}>
                <Form.Control
                  type="password"
                  placeholder="Password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Col>
            </Form.Group>

            {statusText && (
              <Form.Group className="mb-3">
                <p className="text-danger">{statusText}</p>
              </Form.Group>
            )}

            <Form.Group as={Row} className="mb-3">
              <Col>
                <Button type="submit">Sign in</Button>
              </Col>
            </Form.Group>
          </Form>
          <br />
          <h3>Log in using:</h3>
          <a
            href={
              googleAuthEndpoint +
              (searchParams.get("redirect")
                ? `?redirect=${searchParams.get("redirect")}`
                : "")
            }
          >
            <FcGoogle className="login-icon" />
          </a>
          <a
            href={
              `/signup` +
              (searchParams.get("redirect")
                ? `?redirect=${searchParams.get("redirect")}`
                : "")
            }
          >
            Don't have an account? Sign up here
          </a>
        </Card>
      </div>
    </div>
  );
};

export default LogIn;