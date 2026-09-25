/**
 * Module for API functionality and routes.
 */

const axios = require("axios").default;
const bcrypt = require('bcrypt');
const express = require("express");

const util = require('../services/util');

const versionEndpoint = "/v2";
const resource = process.env.NODE_ENV === 'development' ? "" : "/scheduler";
const socketEndpointRoot = process.env.NODE_ENV === 'development' ? "http://localhost:7500" : "https://socket.nathandong.dev";
const rootURL = process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://scheduler.nathandong.dev";
const cookieDomain = process.env.NODE_ENV === 'development' ? ".localhost" : '.nathandong.dev';

console.log("NODE_ENV:", process.env.NODE_ENV)


module.exports = (app, db, auth, passport, io) => {

  // Refresh token + its fingerprint. httpOnly, long-lived. Never touched by JS.
  const secureCookieConfig = {
    secure: true,
    httpOnly: true,
    maxAge: auth.jwtRefreshTokenCookieMaxAge,
    ...(!(process.env.NODE_ENV === 'development') && { domain: cookieDomain })
    , sameSite: 'strict'
  }

  // Access token's fingerprint. httpOnly and short-lived, matching the
  // access token it's paired with.
  const secureAccessCookieConfig = {
    secure: true,
    httpOnly: true,
    maxAge: auth.jwtAccessTokenCookieMaxAge,
    ...(!(process.env.NODE_ENV === 'development') && { domain: cookieDomain })
    , sameSite: 'strict'
  }

  // Non-sensitive, JS-readable UI convenience values only (userId, displayName).
  // The access token itself lives only in the JSON response body / memory.
  const semiSecureCookieConfig = {
    secure: true,
    maxAge: auth.jwtAccessTokenCookieMaxAge,
    ...(!(process.env.NODE_ENV === 'development') && { domain: cookieDomain })
    , sameSite: 'strict'
  }

  const router = express.Router();

  router.get('/test', async (req, res) => {
    res.json({ stuff: "potato" })
  })
  router.get('/version', async (req, res) => {
    res.json({ version: 2 })
  })

  router.post("/testauth", auth.authenticateToken, (req, res) => {
    res.json({ status: "Authentication Successful" })
  });

  /**
   * Mints a fresh access token from a valid refresh token.
   *
   * Requires refresh token + valid fingerprint (userContextRefresh) cookies.
   * Called by the frontend on app load / after OAuth redirect to bootstrap
   * the in-memory access token, since no token is ever passed via redirect.
   */
  router.post('/token',
    async (req, res, next) => {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        console.log("401: No refresh token")
        res.sendStatus(401)
        return
      }
      next();
    },
    auth.checkIfFingerPrintExists, async (req, res, next) => {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        console.log("401: No refresh token")
        res.sendStatus(401)
        return
      }
      try {
        if (!await db.refreshTokenExists(refreshToken)) {
          res.sendStatus(401)
          return
        }
      } catch (err) {
        console.log(err)
        res.sendStatus(500)
        return
      }
      res.locals.refreshToken = refreshToken;
      next()
    },
    auth.refreshAccessToken
    ,
    async (req, res, next) => {
      const oldRefreshToken = res.locals.refreshToken;

      const [randStringAccess, hashAccess] = await auth.getRandomStringAndHash();
      const newUser = {
        userId: res.locals.user.userId,
        displayName: res.locals.user.displayName,
        hash: hashAccess,
        type: res.locals.user.type
      }
      const newAccessToken = auth.generateAccessToken(newUser);

      const [randStringRefresh, hashRefresh] = await auth.getRandomStringAndHash();
      const newRefreshUser = {
        userId: res.locals.user.userId,
        displayName: res.locals.user.displayName,
        hash: hashRefresh,
        type: res.locals.user.type
      }
      const newRefreshToken = auth.generateRefreshToken(newRefreshUser);

      try {
        // Invalidate the old token first. If the insert below fails, the
        // user just has to log in again — safer than a window where both
        // old and new tokens are simultaneously valid.
        await db.deleteRefreshToken(oldRefreshToken);
        await db.insertRefreshToken(newRefreshToken);
        console.log("New refresh token minted");
      } catch (err) {
        console.log(err)
        res.sendStatus(500)
        return
      }

      res.cookie('userContextAccess', randStringAccess, secureAccessCookieConfig);
      res.cookie('refreshToken', newRefreshToken, secureCookieConfig);
      res.cookie('userContextRefresh', randStringRefresh, secureCookieConfig);

      res.json({
        token: newAccessToken,
        userId: res.locals.user.userId,
        displayName: res.locals.user.displayName
      });
    }
  );

  router.get('/auth/google',
    (req, res, next) => {
      passport.authenticate('google', { scope: ['email', 'profile'], state: req.query.redirect })(req, res, next)
    }
  );

  router.get('/auth/google/callback', passport.authenticate('google', {
    failureRedirect: rootURL + '/login',
    failWithError: true,
    session: false
  }), async (req, res, next) => {

    // This callback only establishes the refresh session — no access token
    // is generated here, so nothing can leak via the redirect URL, browser
    // history, or Referer header. The frontend calls POST /token right
    // after landing to get its access token using the refresh cookie below.
    let randStringRefresh, hashRefresh;
    try {
      [randStringRefresh, hashRefresh] = await auth.getRandomStringAndHash();
    } catch (err) {
      console.log(err)
      res.sendStatus(500);
      return
    }

    const userRefresh = {
      userId: req.user.userId,
      displayName: req.user.displayName,
      hash: hashRefresh,
      type: 'GOOGLE',
    }

    const refreshToken = auth.generateRefreshToken(userRefresh);

    try {
      db.insertRefreshToken(refreshToken);

      res.cookie('refreshToken', refreshToken, secureCookieConfig)
      res.cookie('userContextRefresh', randStringRefresh, secureCookieConfig);

      res.cookie('userId', req.user.userId, semiSecureCookieConfig)
      res.cookie('displayName', req.user.displayName, semiSecureCookieConfig)

      if (req.user.redirect !== undefined) {
        res.redirect(req.user.redirect)
      } else {
        res.redirect(rootURL)
      }

    } catch (err) {
      console.log(err)
      res.sendStatus(500);
    }
  }, (err, req, res, next) => {
    console.log(err)
    res.sendStatus(500);
  });

  // Local login/register can return the access token directly in the body
  // since there's no redirect involved, so the /token round trip isn't needed.
  const loginUser = async (res, user, type) => {
    const [randStringAccess, hashAccess] = await auth.getRandomStringAndHash();
    const [randStringRefresh, hashRefresh] = await auth.getRandomStringAndHash();

    const userAccess = { userId: user.id, displayName: user.display_name, hash: hashAccess, type }
    const userRefresh = { userId: user.id, displayName: user.display_name, hash: hashRefresh, type }

    const accessToken = auth.generateAccessToken(userAccess)
    const refreshToken = auth.generateRefreshToken(userRefresh)
    await db.insertRefreshToken(refreshToken)

    res.cookie('userContextAccess', randStringAccess, secureAccessCookieConfig)

    res.cookie('refreshToken', refreshToken, secureCookieConfig)
    res.cookie('userContextRefresh', randStringRefresh, secureCookieConfig)

    res.cookie('userId', user.id, semiSecureCookieConfig)
    res.cookie('displayName', user.display_name, semiSecureCookieConfig)

    return {
      accessToken,
      userId: user.id,
      displayName: user.display_name
    }
  }

  const loginLocalUser = async (res, user) => {
    return loginUser(res, user, "LOCAL");
  }

  const loginGoogleUser = async (res, user) => {
    return loginUser(res, user, "GOOGLE");
  }

  // Register
  router.post('/auth/register', async (req, res) => {
    const { username, password, displayName } = req.body
    if (!username || !password || !displayName) return res.sendStatus(400)

    try {
      const existing = await db.getUserByUsername(username)
      if (existing.length > 0) return res.sendStatus(409)

      const passwordHash = await bcrypt.hash(password, 10)
      const userId = await db.createLocalUser(username, passwordHash, displayName)

      const users = await db.getUserByUsername(username)
      const result = await loginLocalUser(res, users[0])
      res.json(result)
    } catch (err) {
      console.log(err)
      res.sendStatus(500)
    }
  })

  // Login
  router.post('/auth/login', async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) return res.sendStatus(400)

    try {
      const users = await db.getUserByUsername(username)
      if (users.length === 0) return res.sendStatus(401)

      const validPassword = await bcrypt.compare(password, users[0].password)
      if (!validPassword) return res.sendStatus(401)

      const result = await loginLocalUser(res, users[0])
      res.json(result)
    } catch (err) {
      console.log(err);
      res.sendStatus(500)
    }
  })

  /**
   * Deletes Refresh Tokens
   */
  router.delete("/logout", (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      console.log("401: No refresh token")
      res.sendStatus(401)
      return
    }
    try {
      db.deleteRefreshToken(refreshToken)
      res.clearCookie('refreshToken', { path: '/' })
      res.clearCookie('userContextRefresh', { path: '/' })
      res.clearCookie('userContextAccess', { path: '/' })

      res.sendStatus(200)
      return
    } catch (err) {
      console.log(err)
      res.sendStatus(500)
      return
    }
  })

  app.use(`${resource}${versionEndpoint}`, router);
}