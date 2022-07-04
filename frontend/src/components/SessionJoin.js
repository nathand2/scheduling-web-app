import { useEffect, useState } from 'react'
import { useSearchParams, Navigate } from "react-router-dom"

import {RequestHandler} from '../js/requestHandler'

const SessionJoin = () => {

  const [searchParams, setSearchParams] = useSearchParams();
  const [goToSession, setGoToSession] = useState(false)
  const [sessionCode, setSessionCode] = useState('')

  useEffect(() => {
    let didCancel = false;
    const joinSession = async () => {
      if (!didCancel) {
        const inviteCode = searchParams.get("code");
        if (inviteCode) {
          try {
            const data = await RequestHandler.req("/joinsession", "POST", {
              inviteCode: { inviteCode },
            });
            console.log("res data:", data);
            console.log("http://localhost:3000/session/" + data.sessionCode)
            setSessionCode(data.sessionCode)
            setGoToSession(true)
          } catch (err) {
            console.log("Error:", err);
          }
        } else {
          console.log("Invalid invite url");
        }
      }
    }
    joinSession();

    
  })
  return (
    <div>
      {
        goToSession &&
        <>
        <Navigate to={`/session/${sessionCode}`}  />
        </>
      }
      SessionJoin
    </div>
  )
}

export default SessionJoin