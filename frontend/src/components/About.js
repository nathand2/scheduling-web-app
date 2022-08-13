// import React from 'react'
import { Link } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const About = () => {
  return (
    <div className="border d-flex align-items-center justify-content-center">
      <Container className="aboutpage-container" fluid>
        <Row style={{ marginBottom: "100px" }}>
          <h1 className="text-accent-blue">About this Scheduler</h1>
          <p>
            The idea behind this collaborative scheduler was to develop a tool
            to help with prelimary planning, a precursor to finalizing plans.
            The scheduler wouldn't be used for concrete plans but rather to ask
            people if and when they could make it for a specific session. After
            everyone gave their input and their available time ranges, people
            can discuss if and when the session will happen.
          </p>
          <p>
            The idea came about when having trouble finding 5 friends at one
            time to play the game Valorant (1-3 & 5 players can queue at a
            time). We would always find it difficult finding 5 players for a
            given time, leading to many instances of waiting around in a lobby
            of 4 players waiting for a fifth. Furthermore, I was also curious
            about how invitation links would work and decided I wanted that to
            be apart of this project.
          </p>
        </Row>
        <Row style={{ marginBottom: "100px" }}>
          <Col>
            <h1 className="text-accent-blue">When to use!</h1>
            <ul className="undecorated-list text-accent-blue">
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
            <h1 className="text-accent-red">When NOT to use!</h1>
            <ul className="undecorated-list text-accent-red">
              <li>
                <h6>Planning an important meeting</h6>
              </li>
              <li>
                <h6>Planning a doctors appointment?</h6>
              </li>
              <li>
                <h6>Events with ALOT of people</h6>
              </li>
            </ul>
          </Col>
        </Row>
        <Row style={{ marginBottom: "100px" }}>
          <h1 className="text-accent-blue">How To Use</h1>
          <ol className="center-list">
            <li>
              <h6>
                <Link to="/login" className="text-accent-blue">
                  Log In
                </Link>{" "}
                or{" "}
                <Link to="/signup" className="text-accent-blue">
                  Sign up
                </Link>
              </h6>
            </li>
            <li>
              <h6>
                <Link to="/sessioncreate" className="text-accent-blue">
                  Create a Session
                </Link>
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
        <Row style={{ marginBottom: "200px" }}>
          <h1 className="text-accent-blue">About me</h1>
          <p>
            I'm Nathan Dong, an aspiring developer looking to dip my toes into
            the the world of technology.
          </p>
          <p>
            Find more of my work{" "}
            <a className="text-accent-blue" href="https://nathandong.com/">
              here
            </a>
          </p>
        </Row>
      </Container>
    </div>
  );
};

export default About;
