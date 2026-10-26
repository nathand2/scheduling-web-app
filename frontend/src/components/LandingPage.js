import React from "react";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

const LandingPage = () => {
  return (
    <div className="border d-flex align-items-center justify-content-center">
      <Container className="landingpage-container" fluid>
        <Row style={{ marginBottom: "30px" }}>
          <h1 className="text-accent-blue">A new way of scheduling</h1>
        </Row>
        <Row style={{ marginBottom: "50px" }}>
          <p>Well... Kinda</p>
        </Row>
        <Row style={{ marginBottom: "50px" }}>
          <h1 className="text-accent-red">A Collaborative Scheduling Tool</h1>
        </Row>
        <Row style={{ marginBottom: "100px" }}>
          <p>
            This scheduler was created to help with preliminary planning
          </p>
          <p>
            Create a session and invite people using a link
          </p>
          <p>
            Visually see if and when
            your friends can make it
          </p>
        </Row>
        <Row style={{ marginBottom: "10px" }}>
          <p>
            Check out our{" "}
            <Link to="/about" className="text-accent-blue">
              About page
            </Link>{" "}
            to learn more about the scheduler and how to use it.
          </p>
          <p>
            Or{" "}
            <Link to="/login" className="text-accent-blue">
              Log in
            </Link>{" "}
            or {/* <a className="text-accent-blue" href="/signup"> */}
            <Link to="/signup" className="text-accent-blue">
              Sign up
            </Link>
            {/* </a> */} to get started
          </p>
        </Row>
        <Link to="/login" className="card-link text-accent-blue">
          <Button className="text-accent-blue">Login</Button>
        </Link>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Link to="/signup" className="card-link text-accent-blue">
          <Button className="text-accent-blue">Sign Up</Button>
        </Link>
        <Row style={{ marginBottom: "150px" }}></Row>
      </Container>
    </div>
  );
};

export default LandingPage;
