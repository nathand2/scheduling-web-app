import { useSearchParams } from "react-router-dom"

import {RequestHandler} from '../js/requestHandler'

// import { useState } from "react";
import { FcGoogle } from "react-icons/fc";

// import Button from "react-bootstrap/Button";
// import Col from "react-bootstrap/Col";
// import Form from "react-bootstrap/Form";
// import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";

const LogIn = () => {
  const googleAuthEndpoint = RequestHandler.endpointRoot + "/auth/google";

  const [searchParams, setSearchParams] = useSearchParams();
  // const [userName, setUsername] = useState('')
  // const [password, setPassword] = useState('')
  // const [statusText, setStatusText] = useState('State')
  // const [statusTextClass, setStatusTextClass] = useState('text-secondary')

  // const userNameLogIn = async (event) => {
  //   event.preventDefault();
  //   const body = {
  //     userName: userName,
  //     password: password
  //   }
  //   console.log("Body:", body)
  // }

  return (
    <div>
      <br />
      <div className="center-container">
        <Card className="auth-card">
          <br />
          <h3>Log in using:</h3>
          <a href={googleAuthEndpoint + (searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : "")}>
            <FcGoogle className="login-icon"></FcGoogle>
          </a>
          <br />
          {/* <Form onSubmit={userNameLogIn}>
            <Form.Group as={Row} className="mb-3" controlId="formHorizontalEmail">
              <Form.Label column sm={2}>
                Username
              </Form.Label>
              <Col sm={10}>
                <Form.Control type="email" placeholder="Email" onChange={(e) => setUsername(e.target.value)} />
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
          </Form> */}
          <a href={`/signup` + `${searchParams.get('redirect') && '?redirect=' + searchParams.get('redirect')}`}>Don't have an account? Sign up here</a>
        </Card>
      </div>
    </div>
  );
};

export default LogIn;
