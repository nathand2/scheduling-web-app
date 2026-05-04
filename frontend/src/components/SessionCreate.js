import "flatpickr/dist/themes/material_green.css";

import { useState } from "react";
import Flatpickr from "react-flatpickr";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import { Navigate } from "react-router-dom";

import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { RequestHandler } from "../js/requestHandler";

const SessionCreate = () => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dtStart, setdtStart] = useState(new Date());
  const [dtEnd, setdtEnd] = useState(
    new Date(new Date().getTime() + 60 * 60 * 4 * 1000)
  );
  const [viewOption, setViewOption] = useState("account-only");

  const [sessionCreated, setSessionCreated] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isCreateSessionLoading, setIsCreateSessionLoading] = useState(false);
  const [statusText, setStatusText] = useState('')


  const dtOptionsConfig = {
    minuteIncrement: 1,
    dateFormat: "M d Y h:m K",
  };

  /**
   * Validates and creates session with POST request
   * @param {object} e - event
   * @returns
   */
  const createSession = async (e) => {
    e.preventDefault();

    console.log("Now:", new Date());

    if (dtStart > dtEnd) {
      alert("Invalid time range. Start must before end");
      return;
    }

    const diff = dtEnd.getTime() - dtStart.getTime();
    const dayDiff = diff / (1000 * 60); // Get difference in minutes
    if (dayDiff < 31) {
      alert("Session must be longer than 30 minutes.");
    }

    const session = {
      title: title,
      desc: desc === "" ? undefined : desc,
      dtStart: dtStart,
      dtEnd: dtEnd,
      attendType: viewOption,
    };
    console.log("Session:", session);

    setIsCreateSessionLoading(true);

    let sessionData;
    let res;
    try {
      res = await RequestHandler.req("/session", "POST", session);
      setIsCreateSessionLoading(false);

      if (res.status < 200 || res.status > 299) {
        // Unable to create session
        setStatusText(`Error: Unable to create session ${res.status}`)
      }
      sessionData = await res.json();
      console.log("New session ID:", sessionData.code);
      setSessionId(sessionData.code);
      setSessionCreated(true);

    } catch (err) {
      console.log("Unable to create session. Error:", err);
    }
  };

  return (
    <div>
      {sessionCreated && (
        <>
          <Navigate to={`/session/${sessionId}`} />
        </>
      )}
      <h1 className="text-accent-blue">Create Session</h1>
      <Container className="sessions-preview d-flex flex-wrap bd-highlight"></Container>
      <Form onSubmit={createSession}>
        <Form.Group className="mb-3 flex-col small-form-group text-start" controlId="formGroupTitle">
          <Form.Label>Session Title</Form.Label>
          <Form.Control
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3 flex-col small-form-group text-start" controlId="formGroupDesc">
          <Form.Label>Session Desciption</Form.Label>
          <Form.Control
            placeholder="Description"
            onChange={(e) => setDesc(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3 flex-col small-form-group text-start">
          <Form.Label>Session Start &nbsp;</Form.Label>
          <Flatpickr
            data-enable-time
            value={dtStart}
            onChange={(dt) => {
              setdtStart(dt[0]);
            }}
            options={{
              ...dtOptionsConfig,
              minDate: new Date(),
            }}
          />
        </Form.Group>
        <Form.Group className="mb-3 flex-col small-form-group text-start">
          <Form.Label>Session End &nbsp;</Form.Label>
          <Flatpickr
            data-enable-time
            value={dtEnd}
            onChange={(dt) => {
              setdtEnd(dt[0]);
            }}
            options={{
              ...dtOptionsConfig,
              minDate: new Date(),
            }}
          />
        </Form.Group>

        <Form.Group className="mb-3 flex-col small-form-group text-start">
          <Form.Label>Who can attend my Session? &nbsp;</Form.Label>
          <Form.Select
            aria-label="Default select example"
            value={viewOption}
            onChange={(e) => setViewOption(e.target.value)}
          >
            <option value="account-only">People with accounts</option>
            {/* <option value="anyone">Anyone</option> */}
            <option value="group-only" disabled>
              Specific Group (Coming Soon...🙃)
            </option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
            <Button variant="primary" type="submit" style={{ minWidth: "160px" }}>
                {
                  !isCreateSessionLoading ? <>Create Session</> : <AiOutlineLoading3Quarters className="spin" />
                }
            </Button>
        </Form.Group>
        <Form.Group className="mb-3">
          <p className="statusTextClass">
            {statusText}
          </p>
        </Form.Group>
      </Form>

      <Container />
    </div>
  );
};

export default SessionCreate;
