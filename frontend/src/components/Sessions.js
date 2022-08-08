import { useState, useEffect } from 'react'
import { IoMdAddCircle } from 'react-icons/io'

import { Container } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import SessionCard from './SessionCard'

import {RequestHandler} from '../js/requestHandler'
const util = require("../js/util");

const Sessions = () => {
  const [sessions, setSessions] = useState(undefined)
  
  useEffect(() => {
    // Get sessions
    let didCancel = false;
    const getSessions = async () => {
      if (!didCancel) {
        // Get session data from api
        let data, res;
        try {
          res = await RequestHandler.req(`/sessions`, 'GET')
          if (res.status !== 200) {
            console.log("Something went wrong. Res Status:", res.status)
            return
          }
          data = res.data
          data.sessions.map((session) => session.dt_created = util.convertUTCStringToDate(session.dt_created))
          console.log("Sessions:", data.sessions)
          setSessions(data.sessions)
        } catch(err) {
          console.log("Error:", err);
        }
      }
    }
    getSessions();

    
  }, [])
  const calculateSessionStatus = (dtStartString, dtEndString) => {
    const now = new Date();
    if (util.convertUTCStringToDate(dtEndString) < now) {
      return "Expired"
    } else if (util.convertUTCStringToDate(dtStartString) > now) {
      return "Upcoming"
    } else {
      return "Active"
    }
  }
  return (
    <div className='flex'>
      {
        sessions === undefined ? (
          <>
            <br/>Loading Sessions
          </>
        ) : (
          <br/>
        )
      }
      <Container className='sessions-preview d-flex justify-content-center flex-wrap bd-highlight'>
        <Card style={{ width: '18rem' }} bg="light" text="primary">
            {/* <Link to='/sessioncreate' className='link-plain'> */}
            <a href='/sessioncreate' className='link-plain'>
            <Card.Body>
            {/* <Card.Title>Add</Card.Title> */}
            <br />
            <IoMdAddCircle className='large-icon' />
            <Card.Text className='link-plain'>
              Create a Session
            </Card.Text>
            </Card.Body>
          </a>
          {/* </Link> */}
        </Card>
        {
          sessions !== undefined && (
            sessions.map((session) => (<SessionCard key={session.id} code={session.code} title={session.session_title} desc={session.session_desc} dt_created={session.dt_created.toLocaleString()} status={calculateSessionStatus(session.dt_start, session.dt_end)}  />))
          )
        }
      </Container>
    </div>
  )
}

export default Sessions