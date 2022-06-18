import React from 'react'
import { FcGoogle } from 'react-icons/fc'

import { useState, onEffect } from 'react'


const LogIn = () => {
  // AJAX Request
  // const xhttp = new XMLHttpRequest();
  
  // const googleAuthEndpoint = "http://localhost:6500/test"
  const googleAuthEndpoint = "http://localhost:6500/auth/google"


  return (
    <div>
      LogIn
      <br />
      <a href={googleAuthEndpoint}>
        <FcGoogle className='login-icon' ></FcGoogle>
      </a>
    </div>
    
  )
}

export default LogIn