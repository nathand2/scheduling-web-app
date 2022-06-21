/**
 * Authentication Server
 * 
 * Responsible to authenticating, generating, and maintaining JWT
 * access and refresh tokens.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const jwtExpiresIn = '10m';
const saltRounds = 5;

/**
 * Authenticates token is authorization header
 * @param {*} req a request
 * @param {*} res a response
 */
exports.authenticateToken = (req, res, next) => {
  const token = req.body.accessToken;
  const userContext = req.cookies.userContext;

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, accessTokenSecret, (err, user) => {
    if (err) return res.sendStatus(403);

    const userContextHashed = user.hash;
    console.log("Context:")
    console.log(userContextHashed)
    console.log(userContext)
    // Verify user context.
    bcrypt.compare(userContext, userContextHashed, function(err, result) {
      if (err){
        res.sendStatus(500)
        return
      }
      console.log("bcrypt result:", result)
      if (result) {
        next() // Serve content using next callback
      } else {
        res.sendStatus(401)
        return
      }
    });
  })
}

/**
 * Generates JWT access token
 * @param {*} user JS object with name key
 * @returns jwt access token
 */
exports.generateAccessToken = (user) => {
  const accessToken = jwt.sign(user, accessTokenSecret, { expiresIn: jwtExpiresIn });
  return accessToken;
}

/**
 * Generates JWT refresh token
 * @param {*} user JS object with name key
 * @returns jwt refresh token
 */
exports.generateRefreshToken = (user) => {
  const accessToken = jwt.sign(user, refreshTokenSecret);
  return accessToken;
}

/**
 * Refreshes access token
 * @param {*} refreshToken JWT refresh token
 * @returns JWT access token
 */
exports.refreshAccessToken = (req, res, next) => {
  const refreshToken = res.locals.refreshToken
  jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
    if (err){
      res.sendStatus(403);
      return;
    }
    const accessToken = this.generateAccessToken({ name: user.name })
    console.log("Generated access token:", accessToken)
    res.json({ accessToken: accessToken })
    next()
  })
}

/**
 * Gets random string.
 * @returns random string
 */
 exports.getRandomString = async () => {
  return await new Promise((resolve, reject) => {
    crypto.randomBytes(24, (err, buffer) => {
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
exports.hashString = async (input) => {
  const hashedPassword = new Promise((resolve, reject) => {
    bcrypt.hash(input, saltRounds, function(err, hash) {
      if (err) reject(err)
      resolve(hash)
    });
  })
  return hashedPassword
}