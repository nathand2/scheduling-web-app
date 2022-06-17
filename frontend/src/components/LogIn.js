import React from 'react'
import { FcGoogle } from 'react-icons/fc'

import { useState, onEffect } from 'react'


const LogIn = () => {

  const googleAuthEndpoint = "http://localhost:6500/auth/google"

  const googleLogIn = async () => {
    // console.log("Attempting google login");
    // const { accessToken, refreshToken } = await fetch(googleAuthEndpoint);
    // console.log("Fetched stuff?: ", accessToken, refreshToken)
  }

  // onEffect(() => {
  //   // Login?
  //   googleLogIn();
  // }, [])

  return (
    <div>
      LogIn
      <br />
      <FcGoogle className='login-icon' onClick={googleLogIn}></FcGoogle>
    </div>
    
  )
}

export default LogIn