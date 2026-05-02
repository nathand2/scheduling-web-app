import { useSearchParams } from "react-router-dom";

import { RequestHandler } from "../js/requestHandler";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import { Navigate } from "react-router-dom";

const LogIn = ( { setLoggedIn } ) => {
  const googleAuthEndpoint = RequestHandler.endpointRoot + "/auth/google";

  const [searchParams] = useSearchParams();
  const [userName, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [statusText, setStatusText] = useState('')
  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false)
  const [statusTextClass, setStatusTextClass] = useState('text-secondary')

  const userNameLogIn = async (event) => {
    event.preventDefault();
    const body = {
      username: userName,
      password: password
    }
    let res;
    try {
      console.log("b4")
      res = await RequestHandler.req("/auth/login", "POST", body);
      console.log("after")
      console.log(res)

      // Successful login
      if (res.status === 200) {
        setLoggedIn(true);
        setIsLoginSuccessful(true);  // Redirect to home
      }
    } catch (err) {
      setStatusText(`Unable to sign up at this time. [${err}]`);
    }
  }

  return (
    <div>
      {isLoginSuccessful && (
        <>
          <Navigate to={`/`} />
        </>
      )}
      <br />
      <div className="center-container">
        <Card className="auth-card">
          <br />
          <Form onSubmit={userNameLogIn}>
            <Form.Group as={Row} className="mb-3" controlId="formHorizontalEmail">
              <Form.Label column sm={2}>
                Username
              </Form.Label>
              <Col sm={10}>
                <Form.Control type="username" placeholder="Email" onChange={(e) => setUsername(e.target.value)} />
              </Col>
            </Form.Group>

            <Form.Group
              as={Row}
              className="mb-3"
              controlId="formHorizontalPassword"
            >
              <Form.Label column sm={2}>
                Password
              </Form.Label>
              <Col sm={10}>
                <Form.Control type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
              </Col>
            </Form.Group>
            <Form.Group className="mb-3">
              <p className="statusTextClass">
                {statusText}
              </p>
            </Form.Group>

            <Form.Group as={Row} className="mb-3">
              <Col >
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
            <FcGoogle className="login-icon"></FcGoogle>
          </a>
          <a
            href={
              `/signup` +
              `${
                searchParams.get("redirect")
                  ? "?redirect=" + searchParams.get("redirect")
                  : ""
              }`
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
