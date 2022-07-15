import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IoMdAddCircle } from 'react-icons/io'

import { Container } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import SessionCard from './SessionCard'

import {RequestHandler} from '../js/requestHandler'

const Sessions = () => {
  const [sessions, setSessions] = useState([])
  
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
          console.log("data:", data)
          console.log("Res data:", data.sessions)
          setSessions(data.sessions)
        } catch(err) {
          console.log("Error:", err);
        }
      }
    }
    getSessions();
    
  }, [])
  return (
    <div>
      Sessions
      <Container className='sessions-preview d-flex flex-wrap bd-highlight'>
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
          sessions.map((session) => (<SessionCard key={session.id} code={session.code} title={session.session_title} desc={session.session_desc} dt_created={session.dt_created} status={"Status"}  />))
        }
      </Container>
    </div>
  )
}

export default Sessions