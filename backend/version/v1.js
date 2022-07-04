/**
 * Module for API functionality and routes.
 */
 const util = require('../services/util');

const versionEndpoint = "/v1";
const rootURL = "http://localhost:3000"

// For Cookie security
const secureCookieConfig = {
  secure: true,
  httpOnly: true,
  sameSite: 'strict' // Won't work if api and auth on different domains. Helps against CSRF attacks.
}
const semiSecureCookieConfig = {
  secure: true,
  sameSite: 'strict' // Won't work if api and auth on different domains. Helps against CSRF attacks.
}


module.exports = (app, db, auth, passport) => {

  app.get('/test', async (req, res) => {
    res.json({stuff: "potato"})
  })

  app.post("/testauth", auth.authenticateToken, (req, res) => {
    res.json({status: "Authentication Successful"})
  });

  /**
   * Route to refresh access token using refresh token
   * 
   * Requests needs refresh token included in authorization header.
   * Requests need valid fingerprint(user context) in hardened http-only cookie.
   * 
   */
  app.post('/token', auth.checkIfFingerPrintExists, async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("401: No auth header")
      res.sendStatus(401); // No authorization header
      return;
    }
    // Get JWT from Authorization header
    const refreshToken = authHeader.split(' ')[1];
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
      hash: hashAccess,
      type: res.locals.user.type
    }
    const newAccessToken = auth.generateAccessToken(newUser);
    
    // Secure, hardened cookies
    res.cookie('userContextAccess', randStringAccess, secureCookieConfig);
    res.json({ token: newAccessToken});
  }
  )

  app.get('/auth/google',
    passport.authenticate('google', { scope: [ 'email', 'profile' ]})
  );

  app.get('/auth/google/callback', passport.authenticate( 'google', {
    failureRedirect: 'http://localhost:3000/login',
    failWithError: true,
    session: false
  }), async (req, res, next) => {

    // // Generate random string and hash for user context verification.
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
    console.log("User (googleauth):", req.user)

    // On successful authentication, respond with JWT token.
    const userAccess = {
      userId: req.user.userId,
      hash: hashAccess,
      type: 'GOOGLE',
    }
    const userRefresh = {
      userId: req.user.userId,
      hash: hashRefresh,
      type: 'GOOGLE',
    }

    const accessToken = auth.generateAccessToken(userAccess);
    const refreshToken = auth.generateRefreshToken(userRefresh);

    // Add token to db
    try {
      db.insertRefreshToken(refreshToken);

      // Unsecure cookies for tokens to be stored in session storage.
      res.cookie('accessToken', accessToken, semiSecureCookieConfig)
      res.cookie('refreshToken', refreshToken, semiSecureCookieConfig)

      // Secure, hardened cookies
      res.cookie('userContextAccess', randStringAccess, secureCookieConfig);
      res.cookie('userContextRefresh', randStringRefresh, secureCookieConfig);

      res.redirect(rootURL)

    } catch(err) {
      console.log(err)
      res.sendStatus(500); // Internal Error (database error)
    }
  }, (err, req, res, next) => {
    // Handle auth error.
    console.log(err)
    res.sendStatus(500); // Internal Error (database error)
  });

  /**
   * Deletes Refresh Tokens
   */
  app.delete("/logout", (req, res) => {
    // Get refresh token from authorization headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.sendStatus(401); // No authorization header
      return;
    }
    const token = authHeader.split(' ')[1]; // Extract token.

    // Remove refresh token from db
    try {
      db.deleteRefreshToken(token)
      res.sendStatus(200)
      return
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  /**
   * Session Endpoints
   */

  /**
   * Creates a session
   */
  app.post("/session", auth.authenticateToken, async (req, res) => {
    const {title, desc, dtStart, dtEnd, attendType} = req.body;
    try {
      console.log("/session Locals.user:", res.locals.user)
      const sessionCode = util.generateSessionCode();
      const sessionId = await db.createSession(sessionCode, title, dtStart, dtEnd, attendType, desc)
      console.log("User in /session:", res.locals.user)
      // const userId = await db.getUserIdByExternalID(res.locals.user.userId, res.locals.user.type)
      const userId = res.locals.user.userId
      
      const userSessionId =  await db.createUserSession(userId, sessionId, 'owner')
      console.log("New session with code:", sessionCode)
      res.json({code: sessionCode, url: rootURL + "/session/" + sessionCode})
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  /**
   * Gets a session by session code
   */
  app.get("/session/:code", auth.authenticateToken, async (req, res) => {
  try {
    const sessionCode = req.params.code;
    // const userId = await db.getUserIdByExternalID(res.locals.user.name, res.locals.user.type)
    const userId = res.locals.user.userId
    
    const results = await db.getSession(userId, sessionCode)
    if (results.status == 200) {
      res.json({session: results.session})
    } else {
      res.sendStatus(results.status) // Send back 400 status'
    }
  } catch(err) {
    console.log(err)
    res.sendStatus(500) // Internal db error.
    return
  }
  })

  /**
   * Get sessions associated with user
   */
  app.get("/sessions", auth.authenticateToken, async (req, res) => {
    const user = res.locals.user
    const userId = user.userId
    try {
      const results = await db.getSessions(userId);
      res.json({sessions: results})
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  app.post("/sessioninvite", auth.authenticateToken, async (req, res) => {
    try {
      const { sessionCode } = req.body
      const userId = res.locals.user.userId

      // See if user_session of owner exists for user
      const userSessions = await db.getOwnerUserSessionByUserIdAndSessionCode(userId, sessionCode)
      console.log("UserSessions:", userSessions)
      if (!(userSessions.length > 0)) {
        res.sendStatus(403) // Cannot create invite. Not owner or no user_session
        return
      }

      const inviteUuid = await db.createSessionInvite(sessionCode, 'all')
      console.log("Created session_invite with code:", inviteUuid)
      res.json({inviteCode: inviteUuid})
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }

  })

  app.get("/sessioninvite", auth.authenticateToken, async (req, res) => {
    try {
      const sessionCode = req.query.code
      if (!sessionCode) {
        res.sendStatus(400) // No session code
      }
      const user = res.locals.user
      const userId = user.userId

      // See if user_session of owner exists for user
      const userSessions = await db.getUserSessionByUserIdAndSessionCode(userId, sessionCode)
      if (!(userSessions.length > 0)) {
        res.sendStatus(403) // Cannot create invite. Not owner or no user_session
        return
      }

      // Check if session invite exists
      const results = await db.getSessionInviteBySessionCode(sessionCode)
      if (!(results.length > 0)) {
        // If no session invite exists, respond 404
        res.sendStatus(404) // Not found
        return
      }
      
      const inviteUuid = results[0].uuid
      console.log("Created session_invite with code:", inviteUuid)
      res.json({inviteCode: inviteUuid})
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }

  })

  app.post("/joinsession", auth.authenticateToken, async (req, res) => {
    try {
      const inviteCode = req.body.inviteCode.inviteCode
      const userId = res.locals.user.userId

      console.log("Userid:", userId)
      console.log("inviteCode:", inviteCode)

      const sessionCodes = await db.createUserSessionBySessionInviteUuid(userId, inviteCode)
      res.json({sessionCode: sessionCodes})
      // res.redirect(`${rootURL}/session/${sessionCodes[0]}`)
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })
}
