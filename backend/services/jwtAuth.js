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
 * Authenticates token in authorization header
 * @param {*} req a request
 * @param {*} res a response
 */
exports.authenticateToken = (req, res, next) => {
  // Check fingerprint (user context)
  if(!req.cookies.userContextAccess) {
    console.log("401: No fingerprint")
    res.sendStatus(401); // No fingerprint
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.sendStatus(401); // No authorization header
    return;
  }

  // Get JWT from Authorization header
  const token = authHeader.split(' ')[1];

  const userContext = req.cookies.userContextAccess;

  jwt.verify(token, accessTokenSecret, (err, user) => {
    if (err) return res.sendStatus(401);

    const userContextHashed = user.hash; // User context for access token
    console.log("Context:")
    console.log(userContextHashed)
    console.log(userContext)
    console.log("JWT authToken, user:", user)

    // Verify user context.
    bcrypt.compare(userContext, userContextHashed, function(err, result) {
      if (err){
        res.sendStatus(500)
        return
      }
      console.log("bcrypt result:", result)
      if (result) {
        // Pass user object from JWT to next middleware.
        res.locals.user = user
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
  console.log("Generating access token for user:", user)
  const accessToken = jwt.sign(user, accessTokenSecret, { expiresIn: jwtExpiresIn });
  return accessToken;
}

/**
 * Generates JWT refresh token
 * @param {*} user JS object with name key
 * @returns jwt refresh token
 */
exports.generateRefreshToken = (user) => {
  console.log("Generating refresh token for user:", user)
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
  
  const userContext = req.cookies.userContextRefresh;

  // Verify user context
  jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
    if (err) return res.sendStatus(401);

    const userContextHashed = user.hash; // User context for access token

    // Verify user context.
    bcrypt.compare(userContext, userContextHashed, function(err, result) {
      if (err){
        res.sendStatus(500)
        return
      }
      console.log("bcrypt result:", result)
      if (result) {
        res.locals.user = user;
        next();
      } else {
        res.sendStatus(401)
        return
      }
    });
  })
}

exports.checkIfFingerPrintExists = (req, res, next) => {
  if(!req.cookies.userContextAccess && !req.cookies.userContextRefresh) {
    console.log("401: No fingerprint")
    res.sendStatus(401); // No fingerprint
    return;
  }
  next();
}

/**
 * Gets random string.
 * @returns random string
 */
 exports.getRandomString = async () => {
  return await new Promise((resolve, reject) => {
    crypto.randomBytes(24, (err, buffer) => {
      if (err) {
        throw err
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

exports.getRandomStringAndHash = async () => {
  try {
    const randString = await this.getRandomString();
    const stringHash = await this.hashString(randString);
    return [randString, stringHash];
  } catch (err) {
    throw err
  }
}