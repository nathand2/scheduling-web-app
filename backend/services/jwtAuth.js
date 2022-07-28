/**
 * Authentication Server
 * 
 * Responsible to authenticating, generating, and maintaining JWT
 * access and refresh tokens.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto')

const createHash = crypto.createHash;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const jwtExpiresIn = '10m';

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

    // Verify user context.
    try {
      if (this.compareStringAndHash(userContext, userContextHashed)) {
        // Pass user object from JWT to next middleware.
        res.locals.user = user
        next() // Serve content using next callback
      } else {
        return res.sendStatus(401)
      }
    } catch (err) {
      return res.sendStatus(500)
    }
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
    try {
      if (this.compareStringAndHash(userContext, userContextHashed)) {
        // Pass user object from JWT to next middleware.
        res.locals.user = user
        next() // Serve content using next callback
      } else {
        return res.sendStatus(401)
      }
    } catch (err) {
      return res.sendStatus(500)
    }
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
 * Hashes a string using crypto.
 * @param {string} input 
 * @returns hashed string
 */
 exports.hashString = (input) => {
  try {
    const hash = createHash('sha256');
    hash.update(input);
    return hash.copy().digest('hex');
  } catch (err) {
    throw err
  }
}

/**
 * Generates random string and it's SHA-256 hash
 * @returns array [string, string]
 */
exports.getRandomStringAndHash = async () => {
  try {
    const randString = await this.getRandomString();
    const stringHash = this.hashString(randString);
    return [randString, stringHash];
  } catch (err) {
    throw err
  }
}

/**
 * Returns whether string being hashed is same as hash
 * @param {string} string 
 * @param {string} hash 
 * @returns 
 */
exports.compareStringAndHash = (string, hash) => {
  try {
    const hashedString = this.hashString(string)
    return hashedString === hash;
  } catch (err) {
    throw err
  }
}