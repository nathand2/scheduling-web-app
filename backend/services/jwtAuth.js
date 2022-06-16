const jwt = require('jsonwebtoken');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

/**
 * Authenticates token is authorization header
 * @param {*} req a request
 * @param {*} res a response
 */
exports.authenticateToken = (req, res, next) => {
  console.log("Trying to authenticate token")
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, accessTokenSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user
    next();
  })
}

/**
 * Generates JWT access token
 * @param {*} user JS object with name key
 * @returns jwt access token
 */
exports.generateAccessToken = (user) => {
  const accessToken = jwt.sign(user, accessTokenSecret, { expiresIn: '15s' });
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
exports.refreshAccessToken = (req, res) => {
  const refreshToken = res.local.refreshToken
  jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
    if (err){
      res.sendStatus(403);
      return;
    }
    const accessToken = this.generateAccessToken({ name: user.name })
    console.log("Generated access token:", accessToken)
    res.json({ accessToken: accessToken })
  })
}