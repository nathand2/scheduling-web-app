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
    
	// For Cookie security
	const secureCookieConfig = {
	secure: true,
	httpOnly: true,	// Disallow JS from reading secure cookie
	maxAge: auth.jwtRefreshTokenCookieMaxAge,
	...(!(process.env.NODE_ENV === 'development') && { domain: cookieDomain })  // Exclude domain option if localhost
	,sameSite: 'strict' // Won't work if api and auth on different domains. Helps against CSRF attacks.
	}
	const semiSecureCookieConfig = {
	secure: true,
	maxAge: auth.jwtAccessTokenCookieMaxAge,
	...(!(process.env.NODE_ENV === 'development') && { domain: cookieDomain })  // Exclude domain option if localhost
	,sameSite: 'strict' // Won't work if api and auth on different domains. Helps against CSRF attacks.
	}
  
  const router = express.Router();

  router.get(resource + '/test', async (req, res) => {
    res.json({stuff: "potato"})
  })
  router.get(resource + '/version', async (req, res) => {
    res.json({version: 2})
  })

  router.post(resource + "/testauth", auth.authenticateToken, (req, res) => {
    res.json({status: "Authentication Successful"})
  });

  /**
   * Route to refresh access token using refresh token
   * 
   * Requests needs refresh token included in authorization header.
   * Requests need valid fingerprint(user context) in hardened http-only cookie.
   * 
   */
  router.post(resource + '/token', 
		async (req, res, next) => {
			const refreshToken = req.cookies.refreshToken;
			if (!refreshToken) {
				console.log("401: No refresh token")
				res.sendStatus(401) // No refresh token in auth header
				return
			}
			next();
		},
		auth.checkIfFingerPrintExists, async (req, res, next) => {
		// Fetch refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      console.log("401: No refresh token")
      res.sendStatus(401) // No refresh token in auth header
      return
    }
    try {
      // Check if refresh token exists in db of valid refresh tokens.
      if (!await db.refreshTokenExists(refreshToken)) {
        res.sendStatus(401) //
        return
      } 
    } catch(err) {
      res.sendStatus(500) // Internal db error.
      return
    }
    // Res.locals to pass variable to middleware.
    res.locals.refreshToken = refreshToken;
    next()
  },
  auth.refreshAccessToken
  ,
  async (req, res, next) => {
    let randStringAccess, hashAccess;
    // Gets random string and it's hash for fingerprint
    [randStringAccess, hashAccess] = await auth.getRandomStringAndHash();
    console.log("Refresh token... user:", res.locals.user)
    const newUser = {
      userId: res.locals.user.userId,
      displayName: res.locals.user.displayName,
      hash: hashAccess,
      type: res.locals.user.type
    }
    const newAccessToken = auth.generateAccessToken(newUser);
    
    // Secure, hardened cookies
    res.cookie('userContextAccess', randStringAccess, secureCookieConfig);
    res.json({ 
			token: newAccessToken,
			userId: res.locals.user.userId,
			displayName: res.locals.user.displayName
		});
			}
  )

  router.get(resource + '/auth/google',
    (req, res, next) => {
      console.log("uhhh")
      passport.authenticate('google', { scope: [ 'email', 'profile' ], state: req.query.redirect})(req,res,next)
    }
  );

  router.get(resource + '/auth/google/callback', passport.authenticate( 'google', {
    failureRedirect: rootURL + '/login',
    failWithError: true,
    session: false
  }), async (req, res, next) => {

    // Generate random string and hash for user context verification.
    let randStringAccess, hashAccess;
    let randStringRefresh, hashRefresh;
    try {
      [randStringAccess, hashAccess] = await auth.getRandomStringAndHash();
      [randStringRefresh, hashRefresh] = await auth.getRandomStringAndHash();
    } catch(err) {
      console.log(err)
      res.sendStatus(500);
      return
    }
    console.log("User (googleauth!):", req.user)
    console.log("User (googleauth!) displayname:", req.user.displayName)

    // On successful authentication, respond with JWT token.
    const userAccess = {
      userId: req.user.userId,
      displayName: req.user.displayName,
      hash: hashAccess,
      type: 'GOOGLE',
    }
    const userRefresh = {
      userId: req.user.userId,
      displayName: req.user.displayName,
      hash: hashRefresh,
      type: 'GOOGLE',
    }

    const accessToken = auth.generateAccessToken(userAccess);
    const refreshToken = auth.generateRefreshToken(userRefresh);

    console.log("Generated Access Tokens")
    // Add token to db
    try {
      db.insertRefreshToken(refreshToken);

      res.cookie('accessToken', accessToken, semiSecureCookieConfig)
      res.cookie('userContextAccess', randStringAccess, secureCookieConfig);

      res.cookie('refreshToken', refreshToken, secureCookieConfig)
      res.cookie('userContextRefresh', randStringRefresh, secureCookieConfig);

			// ! Refactor this in /me
      res.cookie('userId', req.user.userId, semiSecureCookieConfig)
      res.cookie('displayName', req.user.displayName, semiSecureCookieConfig)

      // If no special redirect given to passport, go to router home
      if (req.user.redirect !== undefined) {
        res.redirect(req.user.redirect)
      } else {
        res.redirect(rootURL)
      }

    } catch(err) {
      console.log(err)
      res.sendStatus(500); // Internal Error (database error)
    }
  }, (err, req, res, next) => {
    // Handle auth error.
    console.log(err)
    res.sendStatus(500); // Internal Error (database error)
  });

  // Shared helper
  const loginUser = async (res, user) => {
    const [randStringAccess, hashAccess] = await auth.getRandomStringAndHash();
    const [randStringRefresh, hashRefresh] = await auth.getRandomStringAndHash();

    const userAccess = { userId: user.id, displayName: user.display_name, hash: hashAccess, type: 'LOCAL' }
    const userRefresh = { userId: user.id, displayName: user.display_name, hash: hashRefresh, type: 'LOCAL' }

    const accessToken = auth.generateAccessToken(userAccess)
    const refreshToken = auth.generateRefreshToken(userRefresh)
    await db.insertRefreshToken(refreshToken)

    res.cookie('accessToken', accessToken, semiSecureCookieConfig)  
    res.cookie('userContextAccess', randStringAccess, semiSecureCookieConfig)

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

  // Register
  router.post(resource + '/auth/register', async (req, res) => {
    const { username, password, displayName } = req.body
    if (!username || !password || !displayName) return res.sendStatus(400)

    try {
      const existing = await db.getUserByUsername(username)
      if (existing.length > 0) return res.sendStatus(409)

      const passwordHash = await bcrypt.hash(password, 10)
      const userId = await db.createLocalUser(username, passwordHash, displayName)

      // Log them in immediately after registering
      const users = await db.getUserByUsername(username)
      const result = await loginUser(res, users[0])
      res.json(result)
    } catch(err) {
      console.log(err)
      res.sendStatus(500)
    }
  })

  // Login
  router.post(resource + '/auth/login', async (req, res) => {
		console.log("/auth/login");
    const { username, password } = req.body
    if (!username || !password) return res.sendStatus(400)

    try {
      const users = await db.getUserByUsername(username)
      if (users.length === 0) return res.sendStatus(401)

      const validPassword = await bcrypt.compare(password, users[0].password)
      if (!validPassword) return res.sendStatus(401)

      const result = await loginUser(res, users[0])
      res.json(result)
    } catch(err) {
			console.log(err);
      res.sendStatus(500)
    }
  })

  /**
   * Deletes Refresh Tokens
   */
  router.delete(resource + "/logout", (req, res) => {
		// Fetch refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      console.log("401: No refresh token")
      res.sendStatus(401) // No refresh token in auth header
      return
    }
    try {
			// Remove refresh token from db
      db.deleteRefreshToken(refreshToken)
			// Clear cookies
			res.clearCookie('refreshToken', {path: '/'})
			res.clearCookie('userContextRefresh', {path: '/'})
			res.clearCookie('userContextAccess', {path: '/'})
			// res.clearCookie('userContextRefresh', { ...secureCookieConfig })
			// res.clearCookie('userContextAccess', { ...secureCookieConfig })

      res.sendStatus(200)
      return
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  app.use(`${resource}${versionEndpoint}`, router);
}
