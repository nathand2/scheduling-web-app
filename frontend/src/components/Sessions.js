import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

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
        try {
          const data = await RequestHandler.req(`/sessions`, 'GET')
          
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
        <Card style={{ width: '18rem' }} bg="secondary" text="white">
            <Link to='/sessioncreate' className='link-plain'>
            <Card.Body>
            <Card.Title>Add</Card.Title>
            <Card.Text className='link-plain'>
              Add stuff
            </Card.Text>
            </Card.Body>
          </Link>
        </Card>
        {
          sessions.map((session) => (<SessionCard key={session.id} code={session.code} title={session.session_title} desc={session.session_desc} dt_created={session.dt_created} status={"Status"}  />))
        }
      </Container>
    </div>
  )
}

export default Sessions