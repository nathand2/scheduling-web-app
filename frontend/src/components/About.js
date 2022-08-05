// import React from 'react'
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const colAccentBlue = "#004E7C";
const colAccentRed = "#B73225";

const About = () => {
  return (
    <div className="border d-flex align-items-center justify-content-center">
      <Container className="aboutpage-container" fluid>
        <Row style={{ marginBottom: "100px" }}>
          <h1 style={{ color: colAccentBlue }}>About this Scheduler</h1>
          <p>
            The idea came about when having trouble finding 5 friends at one
            time to play the game Valorant (1-3 & 5 players can queue at a
            time). We would always find it difficult finding 5 players for a
            given time, leading to many instances of waiting around in a lobby
            of 4 players waiting for a fifth.
          </p>
        </Row>
        <Row style={{ marginBottom: "100px" }}>
          <Col>
            <h1 style={{ color: colAccentBlue }}>When to use!</h1>
            <ul className="undecorated-list">
              <li>
                <h6>Planning a gaming session!</h6>
              </li>
              <li>
                <h6>Planning a DnD session!</h6>
              </li>
              <li>
                <h6>An outting with friends!</h6>
              </li>
            </ul>
          </Col>
          <Col>
            <h1 style={{ color: colAccentRed }}>When NOT to use!</h1>
            <ul className="undecorated-list">
              <li>
                <h6>Planning an important meeting</h6>
              </li>
              <li>
                <h6>Planning a doctors appointment?</h6>
              </li>
              <li>
                <h6>and stuff</h6>
              </li>
            </ul>
          </Col>
        </Row>
        <Row style={{ marginBottom: "100px" }}>
          <h1 style={{ color: colAccentBlue }}>How To Use</h1>
          <ol className="center-list">
            <li>
              <h6>
                <a style={{ color: colAccentBlue }} href="/login">
                  Log In
                </a>{" "}
                or{" "}
                <a style={{ color: colAccentBlue }} href="/signup">
                  Sign up
                </a>
              </h6>
            </li>
            <li>
              <h6>
                <a style={{ color: colAccentBlue }} href="/sessioncreate">
                  Create a Session
                </a>
              </h6>
            </li>
            <li>
              <h6>
                Click 'Share' button in session header to get an invitation link
              </h6>
            </li>
            <li>
              <h6>
                Share your invite link with your friends (ex: Discord, Whatsapp,
                etc.)
              </h6>
            </li>
            <li>
              <h6>
                Click 'Add DtRange' and tell everyone when you can (or can
                maybe) attend. You can add multiple time ranges!
              </h6>
            </li>
            <li>
              <h6>
                Click a time ranges to see extra info and delete it if it's
                yours
              </h6>
            </li>
            <li>
              <h6>
                See what time everyone can make it and discuss with your friends
                when to plan the session or to reschedule for another time
              </h6>
            </li>
          </ol>
        </Row>
      </Container>
    </div>
  );
};

export default About;
