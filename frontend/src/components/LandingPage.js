import React from 'react'
import Button from "react-bootstrap/Button";

const LandingPage = () => {
  return (
    <div>
      LandingPage
      <h1>"Insert inspirational quote here!"</h1>
      <Button variant="primary" href="/login">Login</Button>
      &nbsp;
      <Button variant="primary" href="/signup">Sign Up</Button>
    </div>
  )
}

export default LandingPage