/**
 * Handles API requests, refreshing JWT tokens if needed.
 * 
 * Module handles setting tokens in local/session storage.
 */

export class RequestHandler {
  static endpointRoot = "http://localhost:6500";

  // First API request and silent JWT refresh if needed.
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
        const data = await res.json();  // JWT token valid, return results.
        return {status: 200, data: data}
      } else if (res.status === 401 ) {
        return await this.refreshJWT(resource, reqMethod, reqBody);  // Expired Access token, attempt to refresh JWT
      } else if (res.status === 403 ) {
        // throw new Error("Forbidden");
        return {status: 403}
      } else {
        // Bad request config for internal error.
        // throw new Error("Incorrect RequestHandler.res params or internal error");
        console.log("Incorrect RequestHandler.res params or internal error")
        return {status: res.status}
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
        const data = await res.json();  // JWT token valid, return results.
        return {status: 200, data: data}
      } else if (res.status === 401) {
        // throw new Error (401)  // Newly created JWT problem. Forbidden
        console.log("Newly created JWT problem. Forbidden")
        return {status: 401}
      } else if (res.status === 403 ) {
        // throw new Error("Forbidden");
        console.log("Forbidden")
        return {status: 403}
      } else {
        // throw new Error("Internal error");
        console.log("Internal Error")
        return {status: res.status}
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
      } else if (res.status === 401) {
        // Invalid refresh token
        console.log("Invalid refresh token")
        return {status: 401}
      } else {
        // throw new Error("Internal error");
        console.log(res.statusText)
        return {status: res.status}
      }
    } catch(err) {
      throw err
    }
  }
}