import { useEffect } from 'react'
import { useParams } from "react-router-dom"

const Session = () => {
  useEffect(() => {
    // Get session data from api
    console.log("Hello world")
  }, [])

  let params = useParams()
  return (
    <div>Session: {params.id}</div>
  )
}

export default Session