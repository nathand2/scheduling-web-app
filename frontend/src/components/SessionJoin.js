import { useEffect, useState } from 'react'
import { useSearchParams, Navigate } from "react-router-dom"

import {RequestHandler} from '../js/requestHandler'

const SessionJoin = () => {

  const [searchParams, setSearchParams] = useSearchParams();
  const [goToSession, setGoToSession] = useState(false)
  const [sessionCode, setSessionCode] = useState('')

  let doOnce = true;

  useEffect(() => {
    let didCancel = false;
    const joinSession = async () => {
      if (!didCancel) {
        const inviteCode = searchParams.get("code");
        if (inviteCode) {
          let data, res;
          try {
             res = await RequestHandler.req("/joinsession", "POST", {
              inviteCode: { inviteCode },
            });
            data = res.data
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
    
    if (doOnce) {
      doOnce = false
      joinSession();
    }
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