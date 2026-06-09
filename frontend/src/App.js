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

  useEffect(() => {
    const init = async () => {
      await setStorageJWTs();   // Pick up accessToken cookie from Google OAuth redirect if present
      await getUserData();      // Pick up userId/displayName cookies from Google OAuth redirect if present
      await initializeAuth();   // Get fresh accessToken via refresh token — runs last and wins
    };
    init();
  }, []);

  /**
   * Calls /token endpoint to get a fresh access token using the refresh token cookie.
   * Sets loggedIn state and populates user data.
   */
  const initializeAuth = async () => {
    try {
      const res = await fetch(endpointRoot + "/v2/token", {
        method: "POST",
        credentials: "include",
      });

      if (res.status !== 200) {
        setLoggedIn(false);
        setAccessToken("");
        setUserId(undefined);
        setDisplayName("");
        return;
      }

      const data = await res.json();

      // Write to sessionStorage so RequestHandler can use it immediately
      window.sessionStorage.setItem("accessToken", data.token);

      setAccessToken(data.token);
      setUserId(data.userId);
      setDisplayName(data.displayName);
      setLoggedIn(true);
    } catch (err) {
      console.log(err);
      setLoggedIn(false);
    }
  };

  /**
   * Gets cookie by name
   */
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
  };

  /**
   * Deletes cookie by name
   */
  const deleteCookie = (name) => {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } else {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.nathandong.dev;`;
    }
  };

  /**
   * Picks up accessToken cookie set after Google OAuth redirect.
   * Only runs on initial mount — initializeAuth overwrites this with a fresh token.
   */
  const setStorageJWTs = async () => {
    const accessToken = getCookie("accessToken");
    if (accessToken !== undefined && accessToken !== null) {
      await window.sessionStorage.setItem("accessToken", accessToken);
    }
  };

  /**
   * Picks up userId/displayName cookies set after Google OAuth redirect.
   */
  const getUserData = async () => {
    const userIdFromCookie = getCookie("userId");
    const displayNameFromCookie = getCookie("displayName");

    if (userIdFromCookie !== undefined) {
      await window.localStorage.setItem("userId", userIdFromCookie);
    }
    if (displayNameFromCookie !== undefined) {
      await window.localStorage.setItem("displayName", displayNameFromCookie);
    }

    await setUserId(localStorage.getItem("userId"));
    await setDisplayName(decodeURIComponent(localStorage.getItem("displayName")));
  };

  /**
   * Called by LogIn/SignUp components after successful local auth.
   * Sets state directly from API response — no need to re-fetch /token.
   */
  const onLoginSuccess = (data) => {
    window.sessionStorage.setItem("accessToken", data.accessToken);
    setAccessToken(data.accessToken);
    setUserId(data.userId);
    setDisplayName(data.displayName);
    setLoggedIn(true);
  };

  /**
   * Logs user out — calls API to clear HttpOnly cookies, clears local storage.
   */
  const logOut = async () => {
    console.log("attempt to log out");
    try {
      await fetch(endpointRoot + "/v2/logout", {
        method: "DELETE",
        credentials: "include",
      });
    } catch (err) {
      console.log("Error calling logout endpoint:", err);
    }
    localStorage.removeItem("userId");
    localStorage.removeItem("displayName");
    sessionStorage.removeItem("accessToken");
    deleteCookie("accessToken");
    deleteCookie("displayName");
    deleteCookie("userId");
    setLoggedIn(false);
    setAccessToken("");
    setRefreshToken("");
    setUserId(undefined);
    setDisplayName("");
    window.location.href = "/";
  };

  /**
   * Manually refreshes JWT — dev testing only
   */
  const refreshAccessToken = async () => {
    try {
      const res = await fetch(endpointRoot + "/v2/token", {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 200) {
        const data = await res.json();
        window.sessionStorage.setItem("accessToken", data.token);
        setAccessToken(data.token);
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (err) {
      console.log(err);
      logOut();
    }
  };

  const testEndpoint = async () => {
    let res;
    try {
      res = await RequestHandler.req("/v2/sessions", "GET");
    } catch (err) {
      console.log("Error:", err);
    }
    console.log("Testing endpoint res:", res);
    setAccessToken(await window.sessionStorage.getItem("accessToken"));
  };

  const testRequest = async () => {
    let res;
    try {
      res = await RequestHandler.req("/v2/testauth", "POST");
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
                        <button onClick={refreshAccessToken}>Refresh Access token?</button>
                        <br />
                        <button onClick={testEndpoint}>Test an endpoint</button>
                        <br />
                      </>
                    )}
                  </>
                )}
                {loggedIn === false && loggedIn !== undefined && <LandingPage />}
              </>
            }
          />
          <Route path="/sessioncreate" element={<SessionCreate />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/groups" element={<Groups />} />
          <Route
            path="/login"
            element={<LogIn onLoginSuccess={onLoginSuccess} />}
          />
          <Route
            path="/signup"
            element={<SignUp onLoginSuccess={onLoginSuccess} />}
          />
          <Route path="/session/:code" element={<Session userId={userId} />} />
          <Route path="/sessionjoin" element={<SessionJoin loggedIn={loggedIn} />} />
          <Route path="/about" element={<About />} />
          <Route path="/settings" element={<UserSettings setAppDisplayName={setDisplayName} />} />
        </Routes>
        <CookieToast />
      </div>
    </Router>
  );
}

export default App;