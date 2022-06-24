import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useState, useEffect } from 'react'

import Header from './components/Header'
import LogIn from './components/LogIn'
import SignUp from './components/SignUp'

import {RequestHandler} from './js/requestHandler'

function App() {
  
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  
  useEffect(() => {
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

  const setSessionStorageJWTTokens = async () => {

    const accessToken = getCookie('accessToken');
    const refreshToken = getCookie('refreshToken');

    if (accessToken !== undefined) {
      await window.sessionStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken !== undefined) {
      await window.sessionStorage.setItem('refreshToken', refreshToken);
    }
  }

  const processJWTTokens = async () => {
    await setSessionStorageJWTTokens();
    deleteCookie('accessToken')
    deleteCookie('refreshToken')

    setAccessToken(window.sessionStorage.getItem('accessToken'))
    setRefreshToken(window.sessionStorage.getItem('refreshToken'))

    if (isLoggedIn()) {
      setLoggedIn(true)
    } else {
      setLoggedIn(false)
    }

  }

  const logOut = async () => {
    console.log("attempt to log out")
    await fetch('http://localhost:6500/logout', {
      method: 'DELETE',
      headers: {
        Authorization: `token ${window.sessionStorage.getItem('refreshToken')}`
      }
    });
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('accessToken');
    setLoggedIn(false)
    setAccessToken("")
    setRefreshToken("")
  }

  const isLoggedIn = () => {
    if (sessionStorage.getItem("refreshToken") === null) {
      console.log("No refreshtoken found")
      return false
    } else {
      return true
    }
  }

  const refreshAccessToken = async () => {
    const res = await fetch('http://localhost:6500/token', {
      method: 'POST',
      credentials: 'include', // Include cookies in request
      headers: {
        Authorization: `token ${window.sessionStorage.getItem('refreshToken')}`
      }
    })
    const data = await res.json()
    console.log('Testing Auth results:', data)
    await window.sessionStorage.setItem('accessToken', data.token);
    setAccessToken(data.token)
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
            
            <button onClick={refreshAccessToken}>Refresh Access token?</button>
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
        </Routes>
        
      </div>
    </Router>
  );
}

export default App;
