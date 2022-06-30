import { useEffect, useState } from 'react'
import { useParams } from "react-router-dom"

import {RequestHandler} from '../js/requestHandler'

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
          const data = await RequestHandler.req(`/session/${params.id}`, 'GET')
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

  // let params = useParams()
  return (
    <div>
      Session
      <br />
      {session}
    </div>
  );
}

export default Session