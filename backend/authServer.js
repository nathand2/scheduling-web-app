const express = require('express');
const passport = require('passport');
const cors = require('cors')
const crypto = require('crypto')
require('dotenv').config() // Environment variables stored in .env file

const auth = require('./services/jwtAuth');
const db = require('./db');

const port = 6500;
const app = express();

// For Cookie security
const secureCookieConfig = {
  secure: true,
  httpOnly: true,
  sameSite: 'strict' // Won't work if api and auth on different domains. Helps against CSRF attacks.
}


// Middleware
app.use(cors({
  origin: 'http://localhost:3000'
}));
app.use(express.json());

//Middleware
app.use(express.json());
app.use(passport.initialize());
require('./services/googleStrategy');


/**
 * Gets random string.
 * @returns random string
 */
const getRandomString = async () => {
  return await new Promise((resolve, reject) => {
    crypto.randomBytes(48, (err, buffer) => {
      if (err) {
        reject(-1);
      }
      resolve(buffer.toString('base64'));
    });
  });
}

/**
 * Hashes a string using crypto. TODO: Consider using bcrypt
 * @param {string} input 
 * @returns hashed string
 */
const hashString = (input) => {
  const hash = crypto.createHash('sha256').update(input).digest('base64');
  return hash
}


app.get('/test', async (req, res) => {
  // const randomString = await getRandomString();
  // console.log("Random String:", randomString)
  // const hash = hashString(randomString);
  // console.log("Hashed String:", hash)
  res.json({stuff: "potato"})
})

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
  const randomString = await getRandomString();
  console.log("Random String:", randomString)
  const hash = hashString(randomString);
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
    res.cookie('accessToken', accessToken)
    res.cookie('refreshToken', refreshToken)

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
