const jwt = require('jsonwebtoken');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;


// exports.generateAccessToken = (username) => {
//   const user = {name: username};
//   const accessToken = jwt.sign(user, accessTokenSecret);
//   return accessToken;
// }

exports.authenticateToken = (req, res) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) throw 401;

  jwt.verify(token, accessTokenSecret, (err, user) => {
    if (err) throw 403;
    req.user = user
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
exports.refreshAccessToken = (refreshToken) => {
  jwt.verify(refreshToken, refreshTokenSecret, (err, user) => {
    if (err) throw err;
    const accessToken = this.generateAccessToken({ name: user.name })
    console.log("Generated access token:", accessToken)
    return accessToken
  })
}