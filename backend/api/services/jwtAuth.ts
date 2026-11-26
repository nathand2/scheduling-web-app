/**
 * Authentication Server
 * 
 * Responsible to authenticating, generating, and maintaining JWT
 * access and refresh tokens.
 */

import type { NextFunction } from 'express'
import type { JwtPayload } from 'jsonwebtoken'

const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken')
const crypto = require('crypto') as typeof import('crypto')

type AuthType = 'GOOGLE' | 'LOCAL'

interface AuthToken extends JwtPayload {
  userId: number
  displayName: string
  hash: string
  type: AuthType
}

interface AuthRequest {
  headers: { authorization?: string }
  cookies: Record<string, string | undefined>
}

interface AuthResponse {
  locals: { user?: AuthToken; refreshToken?: string }
  sendStatus: (status: number) => AuthResponse
}

const isAuthToken = (value: unknown): value is AuthToken => {
  if (typeof value !== 'object' || value === null) return false
  const payload = value as Partial<AuthToken>
  return typeof payload.userId === 'number' && typeof payload.displayName === 'string' &&
    typeof payload.hash === 'string' && (payload.type === 'GOOGLE' || payload.type === 'LOCAL')
}

const createHash = crypto.createHash;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;
const hashString = (input: string) => {
  const hash = createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
};
const compareStringAndHash = (value: string, expectedHash: string) =>
  hashString(value) === expectedHash;
const getRandomString = () => new Promise<string>((resolve, reject) => {
  crypto.randomBytes(24, (error, buffer) => {
    if (error) return reject(error);
    resolve(buffer.toString('base64'));
  });
});

// All lifetimes in milliseconds
const jwtAccessTokenLifetimeMs = process.env.NODE_ENV === "development" ?
                                  30 * 1000 :      // 30 sec for dev env
                                  20 * 60 * 1000;      // 20 min for prod env
const jwtRefreshTokenLifetimeMs = process.env.NODE_ENV === "development" ?
                                  3 * 60 * 1000 :           // 3 min for dev env
                                  7 * 24 * 60 * 60 * 1000;   // 7 days for prod env

// Cookie maxAge uses ms directly
exports.jwtAccessTokenCookieMaxAge = jwtAccessTokenLifetimeMs
exports.jwtRefreshTokenCookieMaxAge = jwtRefreshTokenLifetimeMs

// JWT expiresIn accepts seconds as a number
const jwtAccessTokenExpiresIn = jwtAccessTokenLifetimeMs / 1000
const jwtRefreshTokenExpiresIn = jwtRefreshTokenLifetimeMs / 1000
// Exports if needed externally
exports.jwtAccessTokenExpiresIn = jwtAccessTokenExpiresIn
exports.jwtRefreshTokenExpiresIn = jwtRefreshTokenExpiresIn

/**
 * Authenticates ACCESS token in authorization header
 * @param {*} req a request
 * @param {*} res a response
 */
exports.authenticateToken = (req: AuthRequest, res: AuthResponse, next: NextFunction): void => {


  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("401: Auth Header")
    res.sendStatus(401); // No authorization header
    return;
  }

  // Get JWT from Authorization header
  const token = authHeader.split(' ')[1];
  if(!token) {
    console.log("401: No access token")
    res.sendStatus(401); // No access token
    return;
  }

  const userContext = req.cookies.userContextAccess;
  // Check fingerprint (user context)
  if(!userContext) {
    console.log("401: No userContextAccess fingerprint")
    res.sendStatus(401); // No fingerprint
    return;
  }

  jwt.verify(token, accessTokenSecret, (err, decoded) => {
    if (err) {
      console.log("401: Could not verify JWT")
      console.log("Token: ", token)
      console.log(err)
      return res.sendStatus(401);
    }
    if (!isAuthToken(decoded)) {
      res.sendStatus(401)
      return
    }
    const userContextHashed = decoded.hash; // User context for access token

    // Verify user context.
    try {
      if (compareStringAndHash(userContext, userContextHashed)) {
        // Pass user object from JWT to next middleware.
        res.locals.user = decoded
        next() // Serve content using next callback
      } else {
        console.log("401: Could not verify user context (fingerprint)")
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
exports.generateAccessToken = (user: AuthToken): string => {
  console.log("Generating access token for user:", user)
  const accessToken = jwt.sign(user, accessTokenSecret, { expiresIn: jwtAccessTokenExpiresIn });
  return accessToken;
}

/**
 * Generates JWT refresh token
 * @param {*} user JS object with name key
 * @returns jwt refresh token
 */
exports.generateRefreshToken = (user: AuthToken): string => {
  console.log("Generating refresh token for user:", user)
  // const accessToken = jwt.sign(user, jwtRefreshTokenExpiresIn);
  const accessToken = jwt.sign(user, refreshTokenSecret, { expiresIn: jwtRefreshTokenExpiresIn });
  return accessToken;
}

/**
 * Refreshes access token
 * ! Does not refresh access token. It only checks fingerprint/user context and extracts user information
 * ! from JWT and saves it as local variable
 * @param {*} refreshToken JWT refresh token
 * @returns JWT access token
 */
exports.refreshAccessToken = (req: AuthRequest, res: AuthResponse, next: NextFunction): void => {
  const refreshToken = res.locals.refreshToken
  if (!refreshToken) {
    res.sendStatus(401)
    return
  }
  
  const userContext = req.cookies.userContextRefresh;

  // Verify user context
  jwt.verify(refreshToken, refreshTokenSecret, (err, decoded) => {
    if (err) return res.sendStatus(401);

    if (!isAuthToken(decoded)) return res.sendStatus(401)

    const userContextHashed = decoded.hash; // User context for access token

    // Verify user context.
    try {
      if (compareStringAndHash(userContext, userContextHashed)) {
        // Pass user object from JWT to next middleware.
        res.locals.user = decoded
        next() // Serve content using next callback
      } else {
        return res.sendStatus(401)
      }
    } catch (err) {
      return res.sendStatus(500)
    }
  })
}

exports.checkIfFingerPrintExists = (req: AuthRequest, res: AuthResponse, next: NextFunction): void => {
  if(!req.cookies.userContextRefresh) {
    console.log("401: No userContextRefresh fingerprint")
    res.sendStatus(401); // No fingerprint
    return;
  }
  next();
}

/**
 * Gets random string.
 * @returns random string
 */
exports.getRandomString = getRandomString;

/**
 * Hashes a string using crypto.
 * @param {string} input 
 * @returns hashed string
 */
exports.hashString = hashString;

/**
 * Generates random string and it's SHA-256 hash
 * @returns array [string, string]
 */
exports.getRandomStringAndHash = async (): Promise<[string, string]> => {
  try {
    const randString = await getRandomString();
    const stringHash = hashString(randString);
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
exports.compareStringAndHash = compareStringAndHash;
