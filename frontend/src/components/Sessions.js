import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { Container } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import SessionCard from './SessionCard'

import {RequestHandler} from '../js/requestHandler'

const fakeSessions = [
  {
    id: 0,
    title: "Session Title",
    desc: "Session description",
    dt_created: "Monday? feb 5th?",
    status: "upcoming",
  },
  {
    id: 1,
    title: "Session Title",
    desc: "Session description",
    dt_created: "Monday? feb 5th?",
    status: "upcoming",
  },
  {
    id: 2,
    title: "Session Title",
    desc: "Session description",
    dt_created: "Monday? feb 5th?",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Session Title",
    desc: "Session description",
    dt_created: "Monday? feb 5th?",
    status: "expired",
  },
  {
    id: 4,
    title: "Session Title",
    desc: "Session description",
    dt_created: "Monday? feb 5th?",
    status: "expired",
  },
]


const Sessions = () => {
  
  const [sessions, setSessions] = useState([])
  
  useEffect(() => {
    // Get sessions
    // const userSessions = fakeSessions;
    let didCancel = false;
    const getSessions = async () => {
      if (!didCancel) {
        // Get session data from api
        console.log("Hello world")
        // const params = useParams();
        try {
          const data = await RequestHandler.req(`/sessions`, 'GET')
          // return data
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
      {/* <a href='/sessioncreate'> */}
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
        {/* </a> */}
        {
          sessions.map((session) => (<SessionCard key={session.id} code={session.code} title={session.session_title} desc={session.session_desc} dt_created={session.dt_created} status={"Status"}  />))
        }
      </Container>
    </div>
  )
}

export default Sessions