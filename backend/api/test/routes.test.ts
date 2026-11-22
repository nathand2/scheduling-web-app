const assert = require("node:assert/strict");
const { before, test } = require("node:test");
const express = require("express");
process.env.NODE_ENV = "development";
const registerV1Routes = require("../version/v1");
const registerV2Routes = require("../version/v2");
const { createResponse, findRouteHandlers, invokeRoute } = require("./route-test-helpers");

let db;
let auth;
let v1Routes;
let v2Routes;
let refreshTokens;

before(() => {
  refreshTokens = new Set(["refresh-current"]);
  db = {
    refreshTokenExists: async (token) => refreshTokens.has(token),
    deleteRefreshToken: async (token) => refreshTokens.delete(token),
    insertRefreshToken: async (token) => refreshTokens.add(token),
    getSession: async () => ({ status: 403 }),
    getSessionById: async () => [{
      dt_start: "2030-01-01 09:00:00",
      dt_end: "2030-01-01 17:00:00",
    }],
    getUserSessionByUserIdAndSessionId: async () => [{ id: 5 }],
    createSessionTimeRange: async () => 15,
    getSessionTimeRangeById: async () => ({ id: 15 }),
    deleteSessionTimeRangeByIdAndUserId: async () => ({ affectedRows: 1 }),
    createUserSessionBySessionInviteUuid: async () => undefined,
  };

  auth = {
    jwtAccessTokenCookieMaxAge: 60_000,
    jwtRefreshTokenCookieMaxAge: 60_000,
    getRandomStringAndHash: async () => ["fingerprint", "fingerprint-hash"],
    generateAccessToken: (user) => `access-${user.userId}`,
    generateRefreshToken: (user) => `refresh-${user.userId}-next`,
    authenticateToken: (req, res, next) => {
      res.locals.user = req.user || { userId: 7, displayName: "Alex", type: "LOCAL" };
      next();
    },
    checkIfFingerPrintExists: (_req, _res, next) => next(),
    refreshAccessToken: (_req, res, next) => {
      res.locals.user = { userId: 7, displayName: "Alex", type: "LOCAL" };
      next();
    },
  };

  const app = express();
  const passport = { authenticate: () => (_req, _res, next) => next() };
  registerV1Routes(app, db, auth, passport);
  registerV2Routes(app, db, auth, passport);

  v1Routes = (path, method) => findRouteHandlers(app, path, method, "/v1");
  v2Routes = (path, method) => findRouteHandlers(app, path, method, "/v2");
});

const callRoute = async (handlers, { body = {}, cookies = {}, headers = {}, query = {}, params = {} } = {}) => {
  const req = {
    body,
    cookies,
    headers,
    query,
    params,
    user: { userId: 7, displayName: "Alex", type: "LOCAL" },
  };
  const res = createResponse();
  await invokeRoute(handlers, req, res);
  return res;
};

test("session access returns the database authorization result", async (t) => {
  const sessionRoute = v1Routes("/session/:code", "get");

  await t.test("returns 403 when the user is not a member", async () => {
    db.getSession = async () => ({ status: 403 });
    const res = await callRoute(sessionRoute, { params: { code: "ABC123" } });
    assert.equal(res.statusCode, 403);
  });

  await t.test("returns 404 when the session does not exist", async () => {
    db.getSession = async () => ({ status: 404 });
    const res = await callRoute(sessionRoute, { params: { code: "MISSING" } });
    assert.equal(res.statusCode, 404);
  });

  await t.test("returns session data to a member", async () => {
    const session = { id: 12, code: "ABC123" };
    db.getSession = async () => ({ status: 200, session });
    const res = await callRoute(sessionRoute, { params: { code: "ABC123" } });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { session });
  });
});

test("joining a session reports missing invites and accepts valid ones", async (t) => {
  const joinSession = v1Routes("/joinsession", "post");

  await t.test("returns 404 when no invite matches", async () => {
    db.createUserSessionBySessionInviteUuid = async () => undefined;
    const res = await callRoute(joinSession, {
      body: { inviteCode: { inviteCode: "missing-invite" } },
    });
    assert.equal(res.statusCode, 404);
  });

  await t.test("returns the session code when the invite is accepted", async () => {
    db.createUserSessionBySessionInviteUuid = async () => ({
      sessionCode: "ABC123",
      userSession: [{ user_id: 7 }],
    });
    const res = await callRoute(joinSession, {
      body: { inviteCode: { inviteCode: "valid-invite" } },
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { sessionCode: "ABC123" });
  });
});

test("availability creation checks membership and the session window", async (t) => {
  const createRange = v1Routes("/sessiontimerange", "post");
  const body = {
    sessionId: 12,
    sessionCode: "ABC123",
    dtStart: "2030-01-01T10:00:00.000Z",
    dtEnd: "2030-01-01T11:00:00.000Z",
    status: "going",
  };

  await t.test("rejects a range that starts before the session", async () => {
    db.createSessionTimeRange = async () => {
      throw new Error("Should not insert an invalid range");
    };
    const res = await callRoute(createRange, {
      body: { ...body, dtStart: "2030-01-01T08:00:00.000Z" },
    });
    assert.equal(res.statusCode, 400);
  });

  await t.test("rejects a range with its end after the session", async () => {
    const res = await callRoute(createRange, {
      body: { ...body, dtEnd: "2030-01-01T18:00:00.000Z" },
    });
    assert.equal(res.statusCode, 400);
  });

  await t.test("rejects a range whose start follows its end", async () => {
    const res = await callRoute(createRange, {
      body: {
        ...body,
        dtStart: "2030-01-01T12:00:00.000Z",
        dtEnd: "2030-01-01T11:00:00.000Z",
      },
    });
    assert.equal(res.statusCode, 400);
  });

  await t.test("rejects a user who is not in the session", async () => {
    db.getUserSessionByUserIdAndSessionId = async () => [];
    const res = await callRoute(createRange, { body });
    assert.equal(res.statusCode, 403);
  });

  await t.test("stores a valid range for a member", async () => {
    db.getUserSessionByUserIdAndSessionId = async () => [{ id: 5 }];
    let insertedWith;
    db.createSessionTimeRange = async (...args) => {
      insertedWith = args;
      return 15;
    };
    const res = await callRoute(createRange, { body });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(insertedWith, [7, 12, body.dtStart, body.dtEnd, "going"]);
    assert.deepEqual(res.body, { insertId: 15 });
  });
});

test("availability deletion only succeeds when the database finds an owned range", async (t) => {
  const deleteRange = v1Routes("/sessiontimerange", "delete");
  const body = { sessionTimeRangeId: 15, userSessionId: 5, sessionCode: "ABC123" };

  await t.test("requires a range ID", async () => {
    const res = await callRoute(deleteRange, { body: {} });
    assert.equal(res.statusCode, 400);
  });

  await t.test("returns 403 when the range does not belong to this user", async () => {
    db.deleteSessionTimeRangeByIdAndUserId = async () => ({ affectedRows: 0 });
    const res = await callRoute(deleteRange, { body });
    assert.equal(res.statusCode, 403);
  });

  await t.test("returns 204 when the user's range is deleted", async () => {
    let deletedWith;
    db.deleteSessionTimeRangeByIdAndUserId = async (...args) => {
      deletedWith = args;
      return { affectedRows: 1 };
    };
    const res = await callRoute(deleteRange, { body });
    assert.equal(res.statusCode, 204);
    assert.deepEqual(deletedWith, [7, 15, 5]);
  });
});

test("refresh tokens rotate on use and logout revokes them", async (t) => {
  const refreshRoute = v2Routes("/token", "post");
  const logoutRoute = v2Routes("/logout", "delete");

  await t.test("rejects a refresh token that is not in the allow list", async () => {
    const res = await callRoute(refreshRoute, { cookies: { refreshToken: "revoked" } });
    assert.equal(res.statusCode, 401);
  });

  await t.test("rotates a valid token and returns a new access token", async () => {
    const res = await callRoute(refreshRoute, {
      cookies: { refreshToken: "refresh-current" },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.accessToken, "access-7");
    assert.equal(refreshTokens.has("refresh-current"), false);
    assert.equal(refreshTokens.has("refresh-7-next"), true);
    assert.ok(res.cookies.some(({ name }) => name === "refreshToken"));
  });

  await t.test("logout revokes the cookie token and clears auth cookies", async () => {
    const res = await callRoute(logoutRoute, {
      cookies: { refreshToken: "refresh-7-next" },
    });
    assert.equal(res.statusCode, 204);
    assert.equal(refreshTokens.has("refresh-7-next"), false);
    assert.deepEqual(
      res.clearedCookies.map(({ name }) => name),
      ["refreshToken", "userContextRefresh", "userContextAccess", "userId", "displayName"]
    );
  });
});
