import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

import { RequestHandler } from "../js/requestHandler";

const UserSettings = ({ setAppDisplayName }) => {
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("displayName")
  );
  const [status, setStatus] = useState("");
  const [statusColor, setStatusColor] = useState("text-danger");

  // Validates new display name and makes PUT request to api
  const changeDisplayName = async (e) => {
    setStatus("");
    setStatusColor("text-secondary");
    e.preventDefault();
    if (displayName === localStorage.getItem("displayName")) {
      setStatusColor("text-danger");
      setStatus(`Cannot set same display name`);
      return;
    } else if (displayName.length > 25) {
      setStatusColor("text-danger");
      setStatus(`Display names cannot be longer than 25 characters`);
      return;
    } else if (displayName.length < 4) {
      setStatusColor("text-danger");
      setStatus(`Display names cannot be shorter than 3 characters`);
      return;
    }
    setStatus(`Trying to submit`);
    console.log("Simulate display name change");
    let res;
    try {
      const reqDisplayName = displayName; // If they fiddle with form
      res = await RequestHandler.req(`/displayname`, "PUT", {
        displayName: displayName,
      });
      if (res.status === 204) {
        setStatus("Successfully changed display name");
        setStatusColor("text-success");
        localStorage.setItem("displayName", reqDisplayName);
        setAppDisplayName(reqDisplayName);

        // Set tokens
        processJWTs();
      } else {
        console.log("Failed");
        setStatus("Failed to change display name");
        setStatusColor("text-danger");
      }
    } catch (err) {
      setStatus("Error");
      setStatusColor("text-danger");
      throw err;
    }
  };

  /**
   * Gets
   * @param {string} name
   * @returns
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
   * Processes JWTs
   */
  const processJWTs = async () => {
    await setStorageJWTs();
    deleteCookie("accessToken");
    deleteCookie("refreshToken");

    const displayNameFromCookie = getCookie("displayName");
    if (displayNameFromCookie !== undefined) {
      await window.localStorage.setItem("displayName", displayNameFromCookie);
    }
    deleteCookie("userId");
    deleteCookie("displayName");
  };

  return (
    <div>
      UserSettings
      <Form onSubmit={changeDisplayName}>
        <Form.Group className="flex-col small-form-group">
          <Form.Label>Change Display Name</Form.Label>
          <Form.Control
            className="small-form-input"
            // value={localStorage.getItem('displayName')}
            placeholder={localStorage.getItem("displayName")}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Form.Text className={statusColor}>{status}</Form.Text>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form.Group>
      </Form>
    </div>
  );
};

export default UserSettings;
