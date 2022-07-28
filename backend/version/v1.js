/**
 * Module for API functionality and routes.
 */

const axios = require("axios").default;

const util = require('../services/util');

const versionEndpoint = "/v1";
const resource = process.env.NODE_ENV === 'development' ? "" : "/scheduler";
const socketEndpointRoot = process.env.NODE_ENV === 'development' ? "http://localhost:7500" : "http://socket.nathandong.com/";
const rootURL = process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://scheduler.nathandong.com";
const cookieDomain = process.env.NODE_ENV === 'development' ? ".localhost" : '.nathandong.com';

console.log("NODE_ENV:", process.env.NODE_ENV)

// For Cookie security
const secureCookieConfig = {
  secure: true,
  httpOnly: true,
  ...(!(process.env.NODE_ENV === 'development') && { domain: cookieDomain })  // Exclude domain option if localhost
  // sameSite: 'strict' // Won't work if api and auth on different domains. Helps against CSRF attacks.
}
const semiSecureCookieConfig = {
  secure: true,
  ...(!(process.env.NODE_ENV === 'development') && { domain: cookieDomain })  // Exclude domain option if localhost
  // sameSite: 'strict' // Won't work if api and auth on different domains. Helps against CSRF attacks.
}


module.exports = (app, db, auth, passport, io) => {

  app.get(resource + '/test', async (req, res) => {
    res.json({stuff: "potato"})
  })

  app.post(resource + "/testauth", auth.authenticateToken, (req, res) => {
    res.json({status: "Authentication Successful"})
  });

  /**
   * Route to refresh access token using refresh token
   * 
   * Requests needs refresh token included in authorization header.
   * Requests need valid fingerprint(user context) in hardened http-only cookie.
   * 
   */
  app.post(resource + '/token', auth.checkIfFingerPrintExists, async (req, res, next) => {
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
      displayName: res.locals.user.displayName,
      hash: hashAccess,
      type: res.locals.user.type
    }
    const newAccessToken = auth.generateAccessToken(newUser);
    
    // Secure, hardened cookies
    res.cookie('userContextAccess', randStringAccess, secureCookieConfig);
    res.json({ token: newAccessToken});
  }
  )

  app.get(resource + '/auth/google',
    passport.authenticate('google', { scope: [ 'email', 'profile' ]})
  );

  app.get(resource + '/auth/google/callback', passport.authenticate( 'google', {
    failureRedirect: rootURL + '/login',
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

      // Unsecure cookies for tokens to be stored in session storage.
      res.cookie('accessToken', accessToken, semiSecureCookieConfig)
      res.cookie('refreshToken', refreshToken, semiSecureCookieConfig)
      // Send back displayName and userId as cookie client knows who user is
      res.cookie('userId', req.user.userId, semiSecureCookieConfig)
      res.cookie('displayName', req.user.displayName, semiSecureCookieConfig)

      // Secure, hardened cookies
      res.cookie('userContextAccess', randStringAccess, secureCookieConfig);
      res.cookie('userContextRefresh', randStringRefresh, {...secureCookieConfig, expires: util.dtRefreshFingerprintCookieExpires()});

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
  app.delete(resource + "/logout", (req, res) => {
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
  app.post(resource + "/session", auth.authenticateToken, async (req, res) => {
    const {title, desc, dtStart, dtEnd, attendType} = req.body;
    try {
      console.log("/session Locals.user:", res.locals.user)
      // const sessionCode = util.generateSessionCode();

      // Generate valid session code
      let sessionCode;
      let count = 0;
      while (count < 10) {
        const tempSessionCode = util.generateSessionCode();
        const sessionsWithCode = await db.getSessionIdBySessionCode(tempSessionCode)
        // If sessions dont exist with this code, continue
        if (!sessionsWithCode.length > 0) {
          sessionCode = tempSessionCode
        }
        count++
      }

      console.log("SESSION post body:", title, desc, dtStart, dtEnd, attendType)

      if (!sessionCode) {
        console.log("Unable to generate valid session code")
        return res.sendStatus(500)  // Internal Error
      }

      const sessionId = await db.createSession(sessionCode, title, dtStart, dtEnd, attendType, desc)
      const userId = res.locals.user.userId
      
      const userSessionId =  await db.createUserSession(userId, sessionId, 'owner')
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
  app.get(resource + "/session/:code", auth.authenticateToken, async (req, res) => {
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
  app.get(resource + "/sessions", auth.authenticateToken, async (req, res) => {
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

  app.post(resource + "/sessioninvite", auth.authenticateToken, async (req, res) => {
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

  app.get(resource + "/sessioninvite", auth.authenticateToken, async (req, res) => {
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
        res.sendStatus(401) // Cannot create invite. Not apart of session
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

  app.post(resource + "/joinsession", auth.authenticateToken, async (req, res) => {
    try {
      const inviteCode = req.body.inviteCode.inviteCode
      const userId = res.locals.user.userId

      console.log("Userid:", userId)
      console.log("inviteCode:", inviteCode)

      const {sessionCode, userSession} = await db.createUserSessionBySessionInviteUuid(userId, inviteCode)
      
      // If new userSession created, notify session attendees
      if (userSession !== undefined) {
        // Send post request to websocket api
        try {
          const response = await axios.post(socketEndpointRoot + '/usersession', {
            userSessionData: userSession[0],
            sessionCode: sessionCode
          });
          console.log(response);
        } catch (error) {
          console.error(error);
        }
      }

      res.json({sessionCode: sessionCode})
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  app.post(resource + '/sessiontimerange', auth.authenticateToken, async (req, res) => {
    try {
      const userId = res.locals.user.userId  // User Id from JWT token
      const { sessionId, sessionCode, dtStart, dtEnd, status } = req.body  // Post body
      const dateStart = new Date(dtStart)
      const dateEnd = new Date(dtEnd)
      // Check for valid dt range
      if (dateStart > dateEnd) {
        console.log("Invalid dt range. Start < End")
        res.sendStatus(400) // Client Error
        return
      }

      const session = (await db.getSessionById(sessionId))[0]
      const sessionDtStart = session.dt_start
      const sessionDtEnd = session.dt_end
      
      const sessionDateStart = new Date(sessionDtStart)
      const sessionDateEnd = new Date(sessionDtEnd)
      
      if ((sessionDateStart <= dateStart && sessionDateEnd >= dateEnd)) {
        console.log("Invalid dt range.")
        return res.sendStatus(400)  // Client Error
      }
      
      // Check if user is apart of session
      const userSessions = await db.getUserSessionByUserIdAndSessionId(userId, sessionId)
      if (!userSessions > 0) {
        // User not apart of session
        res.sendStatus(403) // Forbidden
        return
      }

      const insertId = await db.createSessionTimeRange(userId, sessionId, dtStart, dtEnd, status)
      const sessionTimeRange = await db.getSessionTimeRangeById(insertId)
      const postBody = {
        sessionTimeRange: {
          ...sessionTimeRange,
          user_id: userId,
          display_name: res.locals.user.displayName
        },
        sessionCode: sessionCode
      }
      // Send post request to websocket api
      try {
        const response = await axios.post(socketEndpointRoot + '/sessiontimerange', postBody);
        console.log(response);
      } catch (error) {
        console.error(error);
      }

      res.json({insertId: insertId})

    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  app.delete(resource + '/sessiontimerange', auth.authenticateToken, async (req, res) => {
    try {
      const userId = res.locals.user.userId  // User Id from JWT token
      const {sessionTimeRangeId, userSessionId, sessionCode} = req.body;
      
      // Not sessionTimeRangeId in body, return 400
      if (!sessionTimeRangeId) return res.sendStatus(400);

      const results = await db.deleteSessionTimeRangeByIdAndUserId(userId, sessionTimeRangeId, userSessionId)

      // If no rows affect, no deletion. Range doesn't belong to user
      if (results.affectedRows > 0) {
        // Send Delete request to websocket api
        try {
          const deleteBody = {
            sessionTimeRangeId: sessionTimeRangeId,
            sessionCode: sessionCode
          }
          console.log("Delete Body:", deleteBody)
          await axios.delete(socketEndpointRoot + '/sessiontimerange', {data: deleteBody});
        } catch (error) {
          console.error(error);
        }

        return res.sendStatus(204)  // No content
      } else {
        return res.sendStatus(403)  // Forbidden
      }
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  app.get(resource + '/timeranges', auth.authenticateToken, async (req, res) => {
      
    try {
      const sessionId = req.query.sessionid
      if (!sessionId) {
        console.log("No Session id")
        res.sendStatus(400)  // Client error
        return
      }
      console.log("SessionId:", sessionId)

      const userId = res.locals.user.userId  // User Id from JWT token
      // Check if user is apart of session
      const userSessions = await db.getUserSessionByUserIdAndSessionId(userId, sessionId)
      if (!userSessions > 0) {
        // User not apart of session
        res.sendStatus(403) // Forbidden
        return
      }

      const results = await db.getSessionTimeRanges(sessionId)
      res.json({results: results})

    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  app.get(resource + "/usersessions", auth.authenticateToken, async (req, res) => {
    // Get user sessions for specific session
    const sessionId = req.query.sessionid
    const userId = res.locals.user.userId  // User Id from JWT token

    if (!sessionId) {
      console.log("No Session id")
      res.sendStatus(400)  // Client error
      return
    }

    try {
      // Check if user is apart of session
      const userSessions = await db.getUserSessionByUserIdAndSessionId(userId, sessionId)
      if (!userSessions > 0) {
        // User not apart of session
        res.sendStatus(403) // Forbidden
        return
      }
  
      // Fetch user sessions
      const userSessionsForSession = await db.getUserSessionsBySessionId(sessionId);
      res.send({userSessions: userSessionsForSession})
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  app.put(resource + '/displayname', auth.authenticateToken, async (req, res) => {
    try {
      const userId = res.locals.user.userId  // User Id from JWT token
      const {displayName} = req.body;
  
      if (!displayName || displayName.length > 25 || displayName.length < 4) {
        console.log("Invalid username")
        res.sendStatus(400)
        return
      }
      const results = db.updateDisplayName(userId, displayName)
      console.log("Successfully updated displayName")

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
      // Generate new JWT and refresh tokens
      const userAccess = {
        userId: userId,
        displayName: displayName,
        hash: hashAccess,
        type: res.locals.user.type,
      }
      const userRefresh = {
        userId: userId,
        displayName: displayName,
        hash: hashRefresh,
        type: res.locals.user.type,
      }

    const accessToken = auth.generateAccessToken(userAccess);
    const refreshToken = auth.generateRefreshToken(userRefresh);


    // Get refresh token from authorization headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.sendStatus(401); // No authorization header
      return;
    }
    const token = authHeader.split(' ')[1]; // Extract token.
    // Remove refresh token from db
    await db.deleteRefreshToken(token)

    // Add token to db
    await db.deleteRefreshToken()
    await db.insertRefreshToken(refreshToken);

    // Unsecure cookies for tokens to be stored in session storage.
    res.cookie('accessToken', accessToken, semiSecureCookieConfig)
    res.cookie('refreshToken', refreshToken, semiSecureCookieConfig)
    // Send back displayName and userId as cookie client knows who user is
    res.cookie('userId', userId, semiSecureCookieConfig)
    res.cookie('displayName', displayName, semiSecureCookieConfig)

    // Secure, hardened cookies
    res.cookie('userContextAccess', randStringAccess, secureCookieConfig);
    res.cookie('userContextRefresh', randStringRefresh, {...secureCookieConfig, expires: util.dtRefreshFingerprintCookieExpires()});

    res.sendStatus(204)  // No content
    return
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })
}
