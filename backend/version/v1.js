/**
 * Module for API functionality and routes.
 */

const versionEndpoint = "/v1";

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
        res.sendStatus(403) //
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
    const newUser = {
      name: res.locals.user.name,
      hash: hashAccess
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
      res.sendStatus(500);
      return
    }

    console.log("User context access?:", randStringAccess, hashAccess)
    console.log("User context refresh?:", randStringRefresh, hashRefresh)
    console.log("Hashed access String:", hashAccess)
    console.log("Hashed refresh String:", hashRefresh)

    console.log("User:", req.user)

    // On successful authentication, respond with JWT token.
    const userAccess = {
      name: req.user.id,
      hash: hashAccess
    }
    const userRefresh = {
      name: req.user.id,
      hash: hashRefresh
    }

    const accessToken = auth.generateAccessToken(userAccess);
    const refreshToken = auth.generateRefreshToken(userRefresh);
    console.log("accessToken:", accessToken)
    console.log("refreshToken:", refreshToken)

    // Add token to db
    try {
      db.insertRefreshToken(refreshToken);

      // Unsecure cookies for tokens to be stored in session storage.
      res.cookie('accessToken', accessToken, semiSecureCookieConfig)
      res.cookie('refreshToken', refreshToken, semiSecureCookieConfig)

      // Secure, hardened cookies
      res.cookie('userContextAccess', randStringAccess, secureCookieConfig);
      res.cookie('userContextRefresh', randStringRefresh, secureCookieConfig);

      res.redirect('http://localhost:3000/')

    } catch(err) {
      res.sendStatus(500); // Internal Error (database error)
    }
  }, (err, req, res, next) => {
    // Handle auth error.
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
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  /**
   * Session Endpoints
   */

  app.post("/session", auth.authenticateToken, async (req, res) => {
    const {title, desc, dtStart, dtEnd, attendType} = req.body;
    try {
      const sessionId = await db.createSession(title, dtStart, dtEnd, attendType, desc)
      console.log("User:", res.locals.user)
      const userId = await db.getUserIdByUsername(res.locals.user.name)
      const userSessionId =  await db.createUserSession(userId, sessionId, 'owner')
      console.log("New session with id:", sessionId)
    } catch(err) {
      console.log(err)
      res.sendStatus(500) // Internal db error.
      return
    }
  })

  app.get("/session/:id", auth.authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = await db.getUserIdByUsername(res.locals.user.name)
    const results = await db.getSession(userId, sessionId)
    if (results.status == 200) {
      res.json({session: results.session})
    } else {
      res.sendStatus(results.status)
    }
  } catch(err) {
    console.log(err)
    res.sendStatus(500) // Internal db error.
    return
  }
  })

}