import { useEffect, useState } from 'react'
import { useParams } from "react-router-dom"

import {RequestHandler} from '../js/requestHandler'
import Button from 'react-bootstrap/Button'

const Session = () => {


  const [params, setParams] = useState(useParams())
  const [session, setSession] = useState('')

  useEffect( () => {
    let didCancel = false;
    const getSession = async () => {
      if (!didCancel) {
        // Get session data from api
        console.log("Hello world")
        // const params = useParams();
        try {
          const data = await RequestHandler.req(`/session/${params.code}`, 'GET')
          // return data
          console.log("Res data:", data)
          setSession(JSON.stringify(data))
        } catch(err) {
          console.log("Error:", err);
        }
      }
    }
    getSession();
  }, [])

  const shareWithLink = async () => {
    try {
      const results = await RequestHandler.req('/sessioninvite', 'POST', {sessionCode: params.code})
      console.log("Created session invite:", results)
      console.log("http://localhost:3000/sessionjoin?code=" + results.inviteCode)
    } catch(err) {
      console.log("Error:", err)
    }
  }

  const getShareLink = async () => {
    try {
      const results = await RequestHandler.req(`/sessioninvite?code=${params.code}`, 'GET')
      console.log("Got invite code:", results)
    } catch(err) {
      console.log("Error:", err)
    }
  }

  // let params = useParams()
  return (
    <div>
      Session<br />
      <Button onClick={shareWithLink}>Share with link</Button><br />
      <Button onClick={getShareLink}>Get Share Link</Button><br />
      
      {session}
    </div>
  );
}

export default Session