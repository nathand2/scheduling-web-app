import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useState, useEffect } from 'react'

import Header from './components/Header'
import LogIn from './components/LogIn'
import SignUp from './components/SignUp'

function App() {
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  const setJWTLocalStorage = () => {
    window.sessionStorage.setItem('accessToken', getCookie('accessToken'))
    window.sessionStorage.setItem('refreshToken', getCookie('refreshToken'))
    setAccessToken(window.sessionStorage.getItem('accessToken'))
    setRefreshToken(window.sessionStorage.getItem('refreshToken'))
  }

  const isLoggedIn = () => {
    if (sessionStorage.getItem("accessToken") === null) {
      return false
    } else {
      return true
    }
  }

  const testRequest = () => {
    const stuff = fetch('http://localhost:6500/testauth')
    console.log('Testing Auth results:', stuff)
  }

  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  
  useEffect(() => {
    if (isLoggedIn()) {
      setLoggedIn(true)
      setJWTLocalStorage();
    } else {
      setLoggedIn(false)
    }
  }, [])

  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={
            <>
            Home<br />
            Logged In: { loggedIn.toString() }<br />
            Access Token: { accessToken }<br />
            Refresh Token:  { refreshToken }<br />
            <button onClick={testRequest}>Test auth stuff</button>
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
