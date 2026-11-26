export {};

describe("RequestHandler authentication", () => {
  let RequestHandler: typeof import("./requestHandler").RequestHandler;
  let fetchMock: jest.Mock;
  const originalFetch = global.fetch;

  const response = (status: number, body?: unknown) => ({
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(body),
  });

  beforeEach(() => {
    jest.resetModules();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    ({ RequestHandler } = require("./requestHandler") as typeof import("./requestHandler"));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("sends credentials and the current access token with API requests", async () => {
    const ok = response(200);
    fetchMock.mockResolvedValue(ok);
    RequestHandler.setAccessToken("access-1");

    await RequestHandler.req("/v1/session/ABC123", "GET");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/session/ABC123"),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: { Authorization: "token access-1" },
      })
    );
  });

  test("refreshes an expired token and retries the original request once", async () => {
    const unauthorized = response(401);
    const refreshed = response(200, { accessToken: "access-2" });
    const ok = response(200);
    fetchMock.mockResolvedValueOnce(unauthorized).mockResolvedValueOnce(refreshed).mockResolvedValueOnce(ok);
    RequestHandler.setAccessToken("access-1");

    const result = await RequestHandler.req("/v1/session/ABC123", "GET");

    expect(result).toBe(ok);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]).toEqual([
      expect.stringContaining("/v2/token"),
      { method: "POST", credentials: "include" },
    ]);
    expect(fetchMock.mock.calls[2][1].headers).toEqual({
      Authorization: "token access-2",
    });
    expect(RequestHandler.getAccessToken()).toBe("access-2");
  });

  test("does not refresh rejected login or registration credentials", async () => {
    fetchMock.mockResolvedValue(response(401));

    await RequestHandler.req("/v2/auth/login", "POST", { username: "alex" });
    await RequestHandler.req("/v2/auth/register", "POST", { username: "alex" });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test("clears the token and signals expiration when refresh is rejected", async () => {
    fetchMock.mockResolvedValueOnce(response(401)).mockResolvedValueOnce(response(401));
    RequestHandler.setAccessToken("expired-token");
    const expired = jest.fn();
    window.addEventListener("auth-expired", expired);

    await RequestHandler.req("/v1/session/ABC123", "GET");

    expect(RequestHandler.getAccessToken()).toBeUndefined();
    expect(expired).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    window.removeEventListener("auth-expired", expired);
  });
});
