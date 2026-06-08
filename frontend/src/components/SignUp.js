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

const SignUp = ( { setLoggedIn, setDisplayName, setUserId, setAccessToken  } ) => {
  const googleAuthEndpoint = RequestHandler.endpointRoot + "/v2/auth/google";

  const [searchParams] = useSearchParams();
  // const [email, setEmail] = useState('')
  const [userName, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [statusText, setStatusText] = useState('')
  const [isSignUpSuccessful, setIsSignUpSuccessful] = useState(false)
  const [statusTextClass, setStatusTextClass] = useState('text-secondary')
  // const [redirect, setRedirect] = useState("/")

  const userNameSignUp = async (event) => {
    event.preventDefault();
    const body = {
      username: userName,
      password: password,
      displayName: userName
    }
    let res;
    try {
      res = await RequestHandler.req("/v2/auth/register", "POST", body);

      // Successful Signup
      if (res.status >= 200 && res.status <= 299) {
        const data = await res.json();
        if (data) {
          console.log("b4")
          setDisplayName(data.displayName);
          setUserId(data.userId);
          setAccessToken(data.accessToken);
          console.log("after")

        }
        setLoggedIn(true);
        setIsSignUpSuccessful(true);  // Redirect to home
      } else if (res.status === 409) {
        // Username in use
        setStatusText(`Username already taken. [${res.status}]`);
      }
    } catch (err) {
      console.log(err)
      setStatusText(`Unable to sign up at this time. [${res.status}]`);
    }
  }

  return (
    <div>
      {isSignUpSuccessful && (
        <Navigate to={searchParams.get("redirect") || "/"} />
      )}
      <br />
      <div className="center-container">
        <Card className="auth-card">
          <br />
          <Form onSubmit={userNameSignUp}>
          {/* <Form.Group as={Row} className="mb-3" controlId="formHorizontalEmail">
            <Form.Label column sm={2}>
              Email
            </Form.Label>
            <Col sm={10}>
              <Form.Control type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            </Col>
          </Form.Group> */}

          <Form.Group as={Row} className="mb-3" controlId="formHorizontalUsername">
            <Form.Label column sm={2}>
              Username
            </Form.Label>
            <Col sm={10}>
              <Form.Control type="username" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
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
        
        <h3>Sign Up using:</h3>
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
        <br />
        </Form>
          <a
            href={
              `/login` +
              `${
                searchParams.get("redirect")
                  ? "?redirect=" + searchParams.get("redirect")
                  : ""
              }`
            }
          >
           Have an account? Log in here
          </a>{" "}
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
