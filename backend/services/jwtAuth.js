/**
 * Authentication Server
 * 
 * Responsible to authenticating, generating, and maintaining JWT
 * access and refresh tokens.
 */

const jwt = require('jsonwebtoken');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

/**
 * Authenticates token is authorization header
 * @param {*} req a request
 * @param {*} res a response
 */
exports.authenticateToken = (req, res, next) => {
  // console.log("Trying to authenticate token")
  // const authHeader = req.headers['authorization']
  // const token = authHeader && authHeader.split(' ')[1]
  const token = req.body.accessToken;
  const userContext = req.cookies.userContext;


  if (token == null) return res.sendStatus(401);

  jwt.verify(token, accessTokenSecret, (err, user) => {
    if (err) return res.sendStatus(403);

    // Verify user context.
    bcrypt.compare(req.body.password, user.password, function(err, res) {
      if (err){
        res.sendStatus(500)
        return
      }
      if (res) {
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
  const accessToken = jwt.sign(user, accessTokenSecret, { expiresIn: '5m' });
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