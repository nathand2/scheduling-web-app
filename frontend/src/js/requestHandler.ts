/**
 * API requests and the short-lived access token kept in this page's memory.
 * The refresh token is held only by the server in an HttpOnly cookie.
 */
let accessToken: string | undefined;
let refreshPromise: Promise<boolean> | undefined;

export class RequestHandler {
  static endpointRoot: string = process.env.NODE_ENV === 'development' ? "http://localhost:6500" : "https://api.nathandong.dev/scheduler";
  static webSocketEndpoint: string = process.env.NODE_ENV === 'development' ? "http://localhost:6500" : "https://api.nathandong.dev";
  static webSocketPath: string = process.env.NODE_ENV === 'development' ? "/socket/v1" : "/scheduler/socket/v1";
  static appRoot: string = process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://scheduler.nathandong.dev";

  static setAccessToken(token?: string) {
    accessToken = token || undefined;
  }

  static getAccessToken(): string | undefined {
    return accessToken;
  }

  static async req(resource: string, reqMethod: string, reqBody?: unknown): Promise<Response> {
    const response = await this.send(resource, reqMethod, reqBody);
    // Invalid credentials on login/register are expected and must not trigger
    // a refresh attempt. Other 401s may indicate an expired access token.
    if (response.status !== 401 || resource.startsWith('/v2/auth/')) return response;

    const refreshed = await this.refreshAccessToken();
    if (!refreshed) return response;
    return this.send(resource, reqMethod, reqBody);
  }

  static async send(resource: string, reqMethod: string, reqBody?: unknown): Promise<Response> {
    return fetch(`${this.endpointRoot}${resource}`, {
      method: reqMethod,
      credentials: 'include',
      headers: {
        ...(accessToken && { Authorization: `token ${accessToken}` }),
        ...(reqBody && { 'Content-Type': 'application/json' })
      },
      ...(reqBody && { body: JSON.stringify(reqBody) })
    });
  }

  static async refreshAccessToken(): Promise<boolean> {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const response = await fetch(`${this.endpointRoot}/v2/token`, {
            method: 'POST',
            credentials: 'include'
          });
          if (!response.ok) {
            this.setAccessToken();
            if (response.status === 401) {
              window.dispatchEvent(new Event('auth-expired'));
            }
            return false;
          }
          const data = await response.json();
          this.setAccessToken(data.accessToken);
          return Boolean(data.accessToken);
        } finally {
          refreshPromise = undefined;
        }
      })();
    }
    return refreshPromise;
  }
}
