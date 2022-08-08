import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";

import About from "./components/About";
import CookieToast from "./components/CookieToast";
import Header from "./components/Header";
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";
import LogIn from "./components/LogIn";
import SignUp from "./components/SignUp";
import Sessions from "./components/Sessions";
import SessionCreate from "./components/SessionCreate";
import SessionJoin from "./components/SessionJoin";
import Session from "./components/Session";
import Groups from "./components/Groups";
import UserSettings from "./components/UserSettings";

import { RequestHandler } from "./js/requestHandler";

const endpointRoot = RequestHandler.endpointRoot;

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [loggedIn, setLoggedIn] = useState(undefined);
  const [userId, setUserId] = useState(undefined);
  const [displayName, setDisplayName] = useState("");

  const [isDev, setIsDev] = useState(
    !process.env.NODE_ENV || process.env.NODE_ENV === "development"
  );

  // When app loaded, manage login state
  useEffect(() => {
    processJWTs();
    getUserData();
  }, []);

  /**
   * Gets cookie by name
   * @param {string} name
   * @returns cookie as string
   */
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  /**
   * Deletes cookie by name
   * @param {string} name 
   */
  const deleteCookie = (name) => {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } else {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.nathandong.com;`;
    }
  };

  /**
   * Sets JWTs into local/session storage taken from cookies
   */
  const setStorageJWTs = async () => {
    // Get JWT and refresh token from cookies.
    const accessToken = getCookie("accessToken");
    const refreshToken = getCookie("refreshToken");

    if (accessToken !== undefined) {
      await window.sessionStorage.setItem("accessToken", accessToken);
    }
    if (refreshToken !== undefined) {
      await window.localStorage.setItem("refreshToken", refreshToken);
    }
  };

  /**
   * Gets user data from cookies if present
   */
  const getUserData = async () => {
    console.log("Tried to get user data");
    const userIdFromCookie = getCookie("userId");
    const displayNameFromCookie = getCookie("displayName");

    if (userIdFromCookie !== undefined) {
      await window.localStorage.setItem("userId", userIdFromCookie);
    }
    if (displayNameFromCookie !== undefined) {
      await window.localStorage.setItem("displayName", displayNameFromCookie);
    }
    deleteCookie("userId");
    deleteCookie("displayName");

    await setUserId(localStorage.getItem("userId"));
    await setDisplayName(localStorage.getItem("displayName"));
  };

  /**
   * Processes JWTs taken from Cookies
   */
  const processJWTs = async () => {
    await setStorageJWTs();
    deleteCookie("accessToken");
    deleteCookie("refreshToken");

    setAccessToken(window.sessionStorage.getItem("accessToken"));
    setRefreshToken(window.localStorage.getItem("refreshToken"));

    if (isLoggedIn()) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  };

  /**
   * Logs user out using API request and Deleting JWTs
   */
  const logOut = async () => {
    console.log("attempt to log out");
    try {
      await fetch(endpointRoot + "/logout", {
        method: "DELETE",
        headers: {
          Authorization: `token ${window.localStorage.getItem("refreshToken")}`,
        },
      });
      localStorage.removeItem("userId");
      localStorage.removeItem("displayName");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");
      setLoggedIn(false);
      setAccessToken("");
      setRefreshToken("");
      window.location.href = "/"; // Redirect to home
    } catch (err) {
      console.log("Error when logging out");
    }
  };

  /**
   * Determines if user logged in
   * @returns boolean
   */
  const isLoggedIn = () => {
    if (localStorage.getItem("refreshToken") === null) {
      console.log("No refreshtoken found");
      return false;
    } else {
      return true;
    }
  };

  /**
   * Manually refreshes JWT for dev testing
   */
  const refreshAccessToken = async () => {
    try {
      const res = await fetch(endpointRoot + "/token", {
        method: "POST",
        credentials: "include", // Include cookies in request
        headers: {
          Authorization: `token ${window.localStorage.getItem("refreshToken")}`,
        },
      });
      if (res.status === 200 || res.status === 204) {
        const data = await res.json();

        // Set new accessToken in sessionStorage and resend original request
        await window.sessionStorage.setItem("accessToken", data.token);
        setAccessToken(data.token);
      } else if (res.status === 401 || res.status === 403) {
        // Invalid refresh token
        throw new Error("Invalid refresh token");
      } else {
        throw new Error("Internal error");
      }
    } catch (err) {
      console.log(err);
      logOut();
    }
  };

  /**
   * Tests an endpoint for dev
   */
  const testEndpoint = async () => {
    let res;
    try {
      res = await RequestHandler.req("/sessions", "GET");
    } catch (err) {
      console.log("Error:", err);
    }

    console.log("Testing endpoint res:", res);
    setAccessToken(await window.sessionStorage.getItem("accessToken"));
  };

  /**
   * Tests an endpoint for dev
   */
  const testRequest = async () => {
    let res;
    try {
      res = await RequestHandler.req("/testauth", "POST");
    } catch (err) {
      console.log("Error:", err);
    }

    console.log("Testing Auth res:", res);
    setAccessToken(await window.sessionStorage.getItem("accessToken"));
  };

  return (
    <Router>
      <div className="App">
        <Header logOut={logOut} loggedIn={loggedIn} displayName={displayName} />
        <Routes>
          <Route
            path="/"
            element={
              <>
                {loggedIn === true && (
                  <>
                    <Home displayName={displayName} />

                    {isDev && (
                      <>
                        <br />
                        Logged In: {loggedIn.toString()}
                        <br />
                        UserId: {userId}
                        <br />
                        displayName: {displayName}
                        <br />
                        Access Token: {accessToken}
                        <br />
                        Refresh Token: {refreshToken}
                        <br />
                        <button onClick={testRequest}>Test auth stuff</button>
                        <br />
                        <button onClick={refreshAccessToken}>
                          Refresh Access token?
                        </button>
                        <br />
                        <button onClick={testEndpoint}>Test an endpoint</button>
                        <br />
                      </>
                    )}
                  </>
                )}
                {loggedIn === false && loggedIn !== undefined && (
                  <LandingPage />
                )}
              </>
            }
          />
          <Route
            path="/sessioncreate"
            element={
              <>
                <SessionCreate />
              </>
            }
          />
          <Route
            path="/sessions"
            element={
              <>
                <Sessions />
              </>
            }
          />
          <Route
            path="/groups"
            element={
              <>
                <Groups />
              </>
            }
          />
          <Route
            path="/login"
            element={
              <>
                <LogIn />
              </>
            }
          />
          <Route
            path="/signup"
            element={
              <>
                <SignUp />
              </>
            }
          />
          <Route
            path="/session/:code"
            element={
              <>
                <Session />
              </>
            }
          />
          <Route
            path="/sessionjoin"
            element={
              <>
                <SessionJoin loggedIn={loggedIn} />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <About />
              </>
            }
          />
          <Route
            path="/settings"
            element={
              <>
                <UserSettings setAppDisplayName={setDisplayName} />
              </>
            }
          />
        </Routes>
        <CookieToast />
      </div>
    </Router>
  );
}

export default App;
