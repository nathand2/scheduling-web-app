const express = require('express');
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

//Middleware
app.use(express.json());
app.use(passport.initialize());
require('./services/googleStrategy');

app.get('/auth/google',
  passport.authenticate('google', { scope: [ 'email', 'profile' ]})
);

app.get('/auth/google/callback', passport.authenticate( 'google', {
  // failureRedirect: 'http://localhost:5500/login',
  failWithError: true,
  session: false
}), (req, res, next) => {

  // On successful authentication, respond with JWT token.
  const user = {name: req.user.id}
  const accessToken = auth.generateAccessToken(user);
  const refreshToken = auth.generateRefreshToken(user);
  
  // Add token to db
  try {
    db.insertRefreshToken(refreshToken);
    res.json({ accessToken: accessToken, refreshToken: refreshToken });
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
  // Remove refresh token from db
  try {
    db.deleteRefreshToken(req.body.token)
    res.sendStatus(204)
    return
  } catch(err) {
    res.sendStatus(500) // Internal db error.
    return
  }
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
