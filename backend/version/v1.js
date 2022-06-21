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
   */
  app.post('/token', async (req, res, next) => {
    const refreshToken = req.body.token
    if (refreshToken == null) {
      res.sendStatus(401)
      return
    }
    try {
      // Check if refresh token exists in db of valid refresh tokens.
      if (!await db.refreshTokenExists(refreshToken)) {
        res.sendStatus(403)
        return
      } 
    } catch(err) {
      res.sendStatus(500) // Internal db error.
      return
    }
    // Res.locals to pass variable to middleware.
    res.locals.refreshToken = refreshToken;
    next()
  }, auth.refreshAccessToken // Callback
  )

  app.get('/auth/google',
    passport.authenticate('google', { scope: [ 'email', 'profile' ]})
  );

  app.get('/auth/google/callback', passport.authenticate( 'google', {
    failureRedirect: 'http://localhost:3000/login',
    failWithError: true,
    session: false
  }), async (req, res, next) => {

    // Generate random string and hash for user context verification.
    const randomString = await auth.getRandomString();
    console.log("Random String:", randomString)

    let hash;
    // If hash fails, return status 500.
    try {
      hash = await auth.hashString(randomString);
    } catch(err) {
      res.sendStatus(500);
      return
    }

    console.log("Hashed String:", hash)

    // On successful authentication, respond with JWT token.
    const user = {
      name: req.user.id,
      hash: hash
    }

    const accessToken = auth.generateAccessToken(user);
    const refreshToken = auth.generateRefreshToken(user);
    console.log("accessToken:", accessToken)
    console.log("refreshToken:", refreshToken)

    // Add token to db
    try {
      db.insertRefreshToken(refreshToken);

      // Unsecure cookies for tokens to be stored in session storage.
      res.cookie('accessToken', accessToken, semiSecureCookieConfig)
      res.cookie('refreshToken', refreshToken, semiSecureCookieConfig)

      // Secure, hardened cookies
      res.cookie('userContext', randomString, secureCookieConfig);

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
  app.delete("/logout", (req,res) => {
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

}