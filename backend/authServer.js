const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('dotenv').config() // Environment variables stored in .env file

const auth = require('./services/jwtAuth');
const db = require('./db');

const port = 6500;
const app = express();

// Middleware
app.use(express.json());

/**
 * Route to refresh access token using refresh token
 */
app.post('/token', async (req, res) => {
  console.log("Token endpoint start")
  const refreshToken = req.body.token
  if (refreshToken == null) {
    res.sendStatus(401)
    return
  }

  // Check if refresh token exists in db of valid refresh tokens.
  if (!await db.refreshTokenExists(refreshToken)) {
    res.sendStatus(403)
    return
  }
  // Can't move to jwtAuth.js
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      res.sendStatus(403)
      return
    } 
    const accessToken = auth.generateAccessToken({ name: user.name })
    res.json({ accessToken: accessToken })
  })

  // Res.local to pass variable to middleware.
  // res.locals.refreshToken = refreshToken;
  // next()

  // Attempt to try move functionality to jwtAuth.js
  // try {
  //   console.log('refreshTokens', refreshTokens)
  //   const accessToken = auth.refreshAccessToken(refreshToken)
  //   console.log("so....", accessToken)
  // } catch (err) {
  //   console.log(err)
  //   res.sendStatus(403)
  // } finally {
  //   console.log("so.... again", accessToken)
  // }
}
// , auth.refreshAccessToken
)

//Middleware
app.use(express.json());
app.use(passport.initialize());
require('./services/googleStrategy');

app.get('/auth/google',
  passport.authenticate('google', { scope: [ 'email', 'profile' ]})
);

app.get('/auth/google/callback', passport.authenticate( 'google', {
  failureRedirect: 'http://localhost:5500/login',
  session: false
}), (req, res) => {

  // On successful authentication, respond with JWT token.
  const user = {name: req.user.id}
  const accessToken = auth.generateAccessToken(user);
  const refreshToken = auth.generateRefreshToken(user);
  
  // Add token to db
  try {
    db.insertRefreshToken(refreshToken);
    res.json({ accessToken: accessToken, refreshToken: refreshToken });
  } catch(err) {
    console.log("Caught db error in authServer.js")
    res.json({ status: "Database Error" })
  }

});

/**
 * Deletes Refresh Tokens
 */
app.delete("/logout", (req,res) => {
  // Remove refresh token from db
  db.deleteRefreshToken(req.body.token)

  res.sendStatus(204)
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
