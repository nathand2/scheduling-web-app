const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const express = require('express');
const cookieParser = require('cookie-parser');

process.env.NODE_ENV = 'development';
const registerV2Routes = require('../version/v2');

let routeHandlers;
let users;
let refreshTokens;

before(() => {
  users = [];
  refreshTokens = new Set();
  const db = {
    getUserByUsername: async (username) => users.filter((user) => user.username === username),
    createLocalUser: async (username, password, displayName) => {
      const user = { id: users.length + 1, username, password, display_name: displayName };
      users.push(user);
      return user.id;
    },
    insertRefreshToken: async (token) => refreshTokens.add(token),
    deleteRefreshToken: async (token) => refreshTokens.delete(token),
    refreshTokenExists: async (token) => refreshTokens.has(token),
  };
  const auth = {
    jwtAccessTokenCookieMaxAge: 60_000,
    jwtRefreshTokenCookieMaxAge: 60_000,
    getRandomStringAndHash: async () => ['test-fingerprint', 'test-hash'],
    generateAccessToken: (user) => `access-${user.userId}`,
    generateRefreshToken: (user) => `refresh-${user.userId}-${Math.random()}`,
    authenticateToken: (_req, _res, next) => next(),
    checkIfFingerPrintExists: (_req, _res, next) => next(),
    refreshAccessToken: (_req, _res, next) => next(),
  };
  const passport = {
    authenticate: () => (_req, _res, next) => next(),
  };
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  registerV2Routes(app, db, auth, passport);
  const router = app._router.stack.find((layer) => layer.name === 'router').handle;
  routeHandlers = (path, method) => {
    const routeLayer = router.stack.find(
      (layer) => layer.route?.path === path && layer.route.methods[method]
    );
    return routeLayer.route.stack.map((layer) => layer.handle);
  };
});

const makeResponse = (): any => ({
  locals: {},
  cookies: [],
  statusCode: 200,
  cookie(name, value, options) {
    this.cookies.push({ name, value, options });
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
  sendStatus(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
});

test('local registration and login enforce account behavior', async () => {
  const register = routeHandlers('/auth/register', 'post')[0];
  const registrationResponse = makeResponse();
  await register(
    { body: { username: 'alex', password: 'correct-horse', displayName: 'Alex' } },
    registrationResponse
  );

  assert.equal(registrationResponse.statusCode, 200);
  const registeredUser = registrationResponse.body;
  assert.equal(registeredUser.userId, 1);
  assert.equal(registeredUser.displayName, 'Alex');
  assert.notEqual(users[0].password, 'correct-horse');

  const duplicateResponse = makeResponse();
  await register(
    { body: { username: 'alex', password: 'another-password', displayName: 'Alex 2' } },
    duplicateResponse
  );
  assert.equal(duplicateResponse.statusCode, 409);

  const login = routeHandlers('/auth/login', 'post')[0];
  const invalidLoginResponse = makeResponse();
  await login(
    { body: { username: 'alex', password: 'wrong-password' } },
    invalidLoginResponse
  );
  assert.equal(invalidLoginResponse.statusCode, 401);

  const validLoginResponse = makeResponse();
  await login(
    { body: { username: 'alex', password: 'correct-horse' } },
    validLoginResponse
  );
  assert.equal(validLoginResponse.statusCode, 200);
  assert.equal(validLoginResponse.body.displayName, 'Alex');
});
