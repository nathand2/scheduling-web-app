/**
 * Handles API requests, refreshing JWT tokens if needed.
 */

export class RequestHandler {
  static endpointRoot = "http://localhost:6500";

  // Handles API requests and silent JWT refresh if needed.
  static async req(resource, reqMethod, reqBody=undefined) {
    console.log("1")
    try {
      const res = await fetch(`${this.endpointRoot + resource}`, {
        method: reqMethod,
        credentials: 'include', // Include cookies in request
        headers: {
          Authorization: `token ${window.sessionStorage.getItem('accessToken')}`,
          ...(reqBody && {'Content-Type': 'application/json'})
        },
        ...(reqBody && {body: JSON.stringify(reqBody)})
      });
      if (res.status === 200) {
        return await res.json();  // JWT token valid, return results.
      } else if (res.status === 401 || res.status === 403) {
        return await this.refreshJWT(resource, reqMethod, reqBody);  // Expired Access token, attempt to refresh JWT
      } else {
        // Bad request config for internal error.
        throw new Error("Incorrect RequestHandler.res params or internal error");
      }
    } catch(err) {
      throw err
    }
  }

  /**
   * 
   * @param {string} resource 
   * @param {string} reqMethod 
   * @param {JSON object} body 
   * @returns 
   */
  static async followUpReq(resource, reqMethod, reqBody=undefined) {
    console.log("2")
    try {
      const res = await fetch(`${this.endpointRoot + resource}`, {
        method: reqMethod,
        credentials: 'include', // Include cookies in request
        headers: {
          Authorization: `token ${window.sessionStorage.getItem('accessToken')}`,
          ...(reqBody && {'Content-Type': 'application/json'})
        },
        ...(reqBody && {body: JSON.stringify(reqBody)})
      });
     
      if (res.status === 200) {
        return await res.json();  // JWT token valid, return results.
      } else if (res.status === 401 || res.status === 403) {
        return {status: "Invalid new Access Token", token: window.sessionStorage.getItem('accessToken')}  // Newly created JWT problem.
      } else {
        throw new Error("Internal error");
      }
    } catch(err) {
      throw err
    }
  }

  static async refreshJWT(resource, reqMethod, body=undefined) {
    console.log("JWT Silent Refresh")
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
        return await this.followUpReq(resource, reqMethod, body);
      } else if (res.status === 401 || res.status === 403) {
        // Invalid refresh token
        throw new Error("Invalid refresh token")
      } else {
        throw new Error("Internal error");
      }
    } catch(err) {
      throw err
    }
  }
}