import { useState, useEffect } from 'react'
import { Container } from 'react-bootstrap';

import SessionCard from './SessionCard'

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
    const userSessions = fakeSessions;
    setSessions(userSessions)
  }, [])
  return (
    <div>
      Sessions
      <Container className='sessions-preview d-flex flex-wrap bd-highlight'>
        {
          sessions.map((session) => (<SessionCard id={session.id} title={session.title} desc={session.desc} dt_created={session.dt_created} status={session.status}  />))
        }
      </Container>
    </div>
  )
}

export default Sessions