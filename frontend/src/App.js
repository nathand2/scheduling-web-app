import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useState, useEffect } from 'react'

import Header from './components/Header'
import LogIn from './components/LogIn'
import SignUp from './components/SignUp'
import Sessions from './components/Sessions'
import SessionCreate from './components/SessionCreate'
import SessionJoin from './components/SessionJoin'
import Session from './components/Session'
import Groups from './components/Groups'

import {RequestHandler} from './js/requestHandler'

function App() {
  
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  
  // When app loaded, manage login state
  useEffect(() => {
    attemptLogIn();
    processJWTTokens();
  }, [])
  
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  const attemptLogIn = () => {
    // if (window.localStorage.getItem('refreshToken')) {
    //   console.log("localStorage Refresh token found")
    //   refreshAccessToken()
    // } else {
    //   console.log("No localStorage refresh token")
    // }
  }

  const setSessionStorageJWTTokens = async () => {
    // Get JWT and refresh token from cookies.
    const accessToken = getCookie('accessToken');
    const refreshToken = getCookie('refreshToken');

    if (accessToken !== undefined) {
      await window.sessionStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken !== undefined) {
      await window.localStorage.setItem('refreshToken', refreshToken);
    }
  }

  const processJWTTokens = async () => {
    await setSessionStorageJWTTokens();
    deleteCookie('accessToken')
    deleteCookie('refreshToken')

    setAccessToken(window.sessionStorage.getItem('accessToken'))
    setRefreshToken(window.localStorage.getItem('refreshToken'))

    if (isLoggedIn()) {
      setLoggedIn(true)
    } else {
      setLoggedIn(false)
    }

  }

  const logOut = async () => {
    console.log("attempt to log out")
    try {
      await fetch('http://localhost:6500/logout', {
        method: 'DELETE',
        headers: {
          Authorization: `token ${window.localStorage.getItem('refreshToken')}`
        }
      });
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('accessToken');
      setLoggedIn(false)
      setAccessToken("")
      setRefreshToken("")
    } catch(err) {
      console.log("Error when logging out")
    }
  }

  // Determine if user logged in
  const isLoggedIn = () => {
    if (localStorage.getItem("refreshToken") === null) {
      console.log("No refreshtoken found")
      return false
    } else {
      return true
    }
  }

  // Manually refresh JWT
  const refreshAccessToken = async () => {
    try {
      const res = await fetch('http://localhost:6500/token', {
        method: 'POST',
        credentials: 'include', // Include cookies in request
        headers: {
          Authorization: `token ${window.localStorage.getItem('refreshToken')}`
        }
      })
      if (res.status === 200 || res.status === 204) {
        const data = await res.json();

        // Set new accessToken in sessionStorage and resend original request
        await window.sessionStorage.setItem('accessToken', data.token);
        setAccessToken(data.token);
      } else if (res.status === 401 || res.status === 403) {
        // Invalid refresh token
        throw new Error("Invalid refresh token")
      } else {
        throw new Error("Internal error");
      }
    } catch(err) {
      console.log(err)
      logOut()
    }
  }
  
  const testEndpoint = async () => {
    let data;
    try {
      data = await RequestHandler.req('/sessions', 'GET')
    } catch(err) {
      console.log("Error:", err);
    }

    console.log('Testing Auth results data:', data)
    setAccessToken(await window.sessionStorage.getItem('accessToken'))
  }

  const testRequest = async () => {
    let data;
    try {
      data = await RequestHandler.req('/testauth', 'POST')
    } catch(err) {
      console.log("Error:", err);
    }

    console.log('Testing Auth results data:', data)
    setAccessToken(await window.sessionStorage.getItem('accessToken'))
  }

  return (
    <Router>
      <div className="App">
        <Header logOut={ logOut } loggedIn={ loggedIn } />
        <Routes>
          <Route path="/" element={
            <>
            Home<br />
            Logged In: { loggedIn.toString() }<br />
            Access Token: { accessToken }<br />
            Refresh Token:  { refreshToken }<br />
            <button onClick={testRequest}>Test auth stuff</button><br />
            
            <button onClick={refreshAccessToken}>Refresh Access token?</button><br />
            <button onClick={testEndpoint}>Test an endpoint</button><br />
            </>
          } />
          <Route path="/sessioncreate" element={
            <>
            <SessionCreate />
            </>
          } />
          <Route path="/sessions" element={
            <>
            <Sessions />
            </>
          } />
          <Route path="/groups" element={
            <>
            <Groups />
            </>
          } />
          <Route path="/login" element={
            <>
            <LogIn />
            </>
          } />
          <Route path="/signup" element={
            <>
            <SignUp />
            </>
          } />
          <Route path="/session/:code" element={
            <>
            <Session />
            </>
          } />
          <Route path="/sessionjoin" element={
            <>
            <SessionJoin />
            </>
          } />
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;
