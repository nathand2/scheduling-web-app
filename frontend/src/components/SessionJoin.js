import { useEffect, useState } from 'react'
import { useSearchParams, Navigate } from "react-router-dom"

import {RequestHandler} from '../js/requestHandler'

const SessionJoin = ({ loggedIn }) => {

  const [searchParams, setSearchParams] = useSearchParams();
  const [goToSession, setGoToSession] = useState(false)
  const [sessionCode, setSessionCode] = useState('')
  const [inviteCode, setInviteCode] = useState(searchParams.get("code"))

  const [redirectElement, setRedirectElement] = useState(<>Redirect element</>)

  let doOnce = true;
  const redirectUrl = RequestHandler.appRoot + `/sessionjoin?code=${searchParams.get("code")}`;
  const loginUrl = '/login?redirect=' + redirectUrl;

  useEffect(() => {
    if (!loggedIn) {
      console.log("LOggedIN:", loggedIn)
      console.log(loginUrl)
      setRedirectElement(
        <>
        <Navigate to={loginUrl}  />
        {/* <a href={loginUrl}>Log in to join session</a> */}
        </>
      );
      return
    }
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
            console.log("res", res)
            if (res.status === 404) {
              setRedirectElement(
                <>
                404 Session Invite not found
                </>
              );
              return
            } else if (res.status !== 200) {
              console.log(res.status)
              return
            }
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
  }, [loggedIn])
  return (
    <div>
      {
        goToSession &&
        <>
        <Navigate to={`/session/${sessionCode}`}  />
        </>
      }
      SessionJoin
      {redirectElement}
    </div>
  )
}

export default SessionJoin