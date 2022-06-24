import React from 'react'
import { FcGoogle } from 'react-icons/fc'

const SignUp = () => {
  const googleAuthEndpoint = "http://localhost:6500/auth/google"
  
  return (
    <div>
      Sign Up
      <br />
      <a href={googleAuthEndpoint}>
        <FcGoogle className='login-icon' ></FcGoogle>
      </a>
    </div>
    
  )
}

export default SignUp