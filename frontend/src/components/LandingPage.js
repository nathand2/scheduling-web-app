import React from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const colAccentBlue = "#004E7C";
const colAccentRed = "#B73225";

const LandingPage = () => {
  return (
    <div className="border d-flex align-items-center justify-content-center">
      <Container className="landingpage-container" fluid>
        <Row style={{ marginBottom: "30px" }}>
          <h1 className="text-accent-blue">A new way of scheduling</h1>
        </Row>
        <Row style={{ marginBottom: "200px" }}>
          <p>Well... Kinda</p>
        </Row>
        <Row style={{ marginBottom: "50px" }}>
          <h1 className="text-accent-red">
            A Collaborative Scheduling Tool
          </h1>
        </Row>
        <Row style={{ marginBottom: "100px" }}>
          <p>
            This scheduler was created to help with{" "}
            <span className="text-accent-blue">preliminary planning</span>
          </p>
          <p>
            Create a session and invite people using a{" "}
            <span className="text-accent-blue">link</span>
          </p>
          <p>
            <span className="text-accent-blue">Visually</span> see if and when
            your friends can make it
          </p>
        </Row>
        <Row style={{ marginBottom: "10px" }}>
          <p>
            <a className="text-accent-blue" href="/about">
              Click Here
            </a>{" "}
            to learn more about the scheduler and how to use it.
          </p>
          <p>
            Or{" "}
            <a className="text-accent-blue" href="/login">
              Log in
            </a>{" "}
            or{" "}
            <a className="text-accent-blue" href="/signup">
              Sign up
            </a>{" "}
            to get started
          </p>
        </Row>
        <Button className="text-accent-blue" href="/login">
          Login
        </Button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <Button className="text-accent-blue" href="/signup">
          Sign Up
        </Button>
        <Row style={{ marginBottom: "150px" }}></Row>
      </Container>
    </div>
  );
};

export default LandingPage;
