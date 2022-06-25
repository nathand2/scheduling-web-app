import "flatpickr/dist/themes/material_green.css";

import { useState, useEffect } from 'react'
import Flatpickr from "react-flatpickr";
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"
import Container from 'react-bootstrap/Container';

const SessionCreate = () => {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [dtStart, setdtStart] = useState(new Date())
  const [dtEnd, setdtEnd] = useState(new Date(new Date().getTime() + 60 * 60 * 24 * 1000))
  const [viewOption, setViewOption] = useState('account-only')

  const dtOptionsConfig = {
    minuteIncrement: 5,
  }

  const datePlus24Hrs = () => {
    return new Date(new Date().getTime() + 60 * 60 * 24 * 1000);
  }

  const createSession = (e) => {
    e.preventDefault();
    const session = {
      title: title,
      desc: desc,
      dtStart: dtStart,
      dtEnd: dtEnd,
      viewOption: viewOption,
    }
    console.log("Session:", session)
  }

  return (
    <div>
      <Container className="sessions-preview d-flex flex-wrap bd-highlight"></Container>
      <Form onSubmit={createSession}>
        <Form.Group className="mb-3" controlId="formGroupEmail">
          <Form.Label>Session Title</Form.Label>
          <Form.Control
            placeholder="Title"
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="formGroupPassword">
          <Form.Label>Session Desciption</Form.Label>
          <Form.Control
            placeholder="Description"
            onChange={(e) => setDesc(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Session Start &nbsp;</Form.Label>
          <Flatpickr
            data-enable-time
            value={dtStart}
            onChange={(dt) => {
              setdtStart(dt);
            }}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Session End &nbsp;</Form.Label>
          <Flatpickr
            data-enable-time
            value={dtEnd}
            onChange={(dt) => {
              setdtEnd(dt);
            }}
            options={{
              ...dtOptionsConfig,
              minDate: dtStart,
            }}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Who can attend my Session? &nbsp;</Form.Label>
          <Form.Select
            aria-label="Default select example"
            value={viewOption}
            onChange={(e) => setViewOption(e.target.value)}
          >
            <option value="account-only">People with accounts</option>
            <option value="anyone">Anyone</option>
            <option value="group-only" disabled>
              Specific Group (Coming Soon...🙃)
            </option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form.Group>
      </Form>

      <Container />
    </div>
  );
}

export default SessionCreate