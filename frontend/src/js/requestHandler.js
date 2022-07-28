/**
 * Handles API requests, refreshing JWT tokens if needed.
 * 
 * Module handles setting tokens in local/session storage.
 */

export class RequestHandler {
  // static webSocketEndpoint = process.env.NODE_ENV === 'development' ? "http://localhost:7500" : "https://api.nathandong.com/scheduler";
  static webSocketEndpoint = process.env.NODE_ENV === 'development' ? "http://localhost:7500" : "https://socket.nathandong.com";
  static endpointRoot = process.env.NODE_ENV === 'development' ? "http://localhost:6500" : "https://api.nathandong.com/scheduler";
  static appRoot = process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://scheduler.nathandong.com";  // Frontend url

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
      } else if (res.status === 204) {
        return {status: 204}
      } else if (res.status === 401 ) {
        return await this.refreshJWT(resource, reqMethod, reqBody);  // Expired Access token, attempt to refresh JWT
      } else if (res.status === 403 ) {
        return {status: 403}
      } else {
        // Bad request config for internal error.
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
      } else if (res.status === 204) {
        return {status: 204}
      } else if (res.status === 401) {
        console.log("Newly created JWT problem. Forbidden")
        return {status: 401}
      } else if (res.status === 403 ) {
        console.log("Forbidden")
        return {status: 403}
      } else {
        console.log("Internal Error")
        return {status: res.status}
      }
    } catch(err) {
      throw err
    }
  }

  static async refreshJWT(resource, reqMethod, body=undefined) {
    console.log("JWT Silent Refresh")
    if (!window.localStorage.getItem('refreshToken')) {
      console.log("No refresh token")
      return {status: 401}
    }
    try {
      const res = await fetch(this.endpointRoot + '/token', {
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
        console.log("Invalid refresh token")
        return {status: 401}
      } else {
        console.log(res.statusText)
        return {status: res.status}
      }
    } catch(err) {
      throw err
    }
  }
}