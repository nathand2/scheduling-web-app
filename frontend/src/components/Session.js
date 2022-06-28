import { useEffect, useState } from 'react'
import { useParams } from "react-router-dom"

import {RequestHandler} from '../js/requestHandler'

const Session = () => {


  const [params, setParams] = useState(useParams())

  useEffect( () => {
    
    const getSession = async () => {
      // Get session data from api
      console.log("Hello world")
      // const params = useParams();
      try {
        const data = await RequestHandler.req(`/session/${params.id}`, 'GET')
        // return data
        console.log("Res data:", data)
      } catch(err) {
        console.log("Error:", err);
      }
    }

    //  // call the function
    // const result = getSession()
    // // make sure to catch any error
    // .catch(console.error);;
    getSession();


  }, [])

  // let params = useParams()
  return (
    <div>Session</div>
  )
}

export default Session