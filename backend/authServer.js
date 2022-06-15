const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
require('dotenv').config() // Environment variables stored in .env file

const auth = require('./services/jwtAuth');

const port = 6500;

const app = express();

// Middleware
app.use(express.json());

// Local array of refresh tokens. Implement using db
let refreshTokens = [];

/**
 * Route to refresh access token using refresh token
 */
app.post('/token', (req, res) => {
  const refreshToken = req.body.token
  if (refreshToken == null) return res.sendStatus(401)

  // Check if refresh token exists in collection of valid refresh tokens.
  if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)

  // Can't move to jwtAuth.js
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403)
    const accessToken = auth.generateAccessToken({ name: user.name })
    res.json({ accesToken: accessToken })
  })

  // Attempt to try move functionality to jwtAuth.js
  // try {
  //   console.log('refreshTokens', refreshTokens)
  //   const accessToken = auth.refreshAccessToken(refreshToken)
  //   res.json({ fucker: "fucker" })
  //   console.log("so....", accessToken)
  // } catch (err) {
  //   console.log(err)
  //   res.sendStatus(403)
  // } finally {
  //   console.log("so.... again", accessToken)
  // }

})

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
  refreshTokens.push(refreshToken);
  res.json({ accessToken: accessToken, refreshToken: refreshToken });
});

/**
 * Deletes Refresh Tokens
 */
app.delete("/logout", (req,res) => {
  // Remove refresh token from refreshToken collection
  refreshTokens = refreshTokens.filter(token => token !== req.body.token)
  res.sendStatus(204)
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
