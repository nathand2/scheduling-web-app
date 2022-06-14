const jwt = require('jsonwebtoken');

const jwt_secret = process.env.JWT_TOKEN_SECRET;

// check if Token exists on request Header and attach token to request as attribute
exports.checkTokenMW = (req, res, next) => {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        req.token = bearerHeader.split(' ')[1];
        next();
    } else {
        res.sendStatus(403);
    }
};

// Verify Token validity and attach token data as request attribute
exports.verifyToken = (req, res) => {
    jwt.verify(req.token, jwt_secret, (err, authData) => {
        if(err) {
            res.sendStatus(403);
        } else {
            return req.authData = authData;
        }
    })
};

// Issue Token
exports.signToken = (req, res) => {
    jwt.sign({userId: req.user.id}, jwt_secret, {expiresIn:'5 min'}, (err, token) => {
        if(err){
            res.sendStatus(500);
        } else {
            res.json({token});
        }
    });
}

exports.generateAccessToken = (username) => {
  return jwt.sign(username, jwt_secret, { expiresIn: '1800s' });
}

exports.authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    console.log(err)

    if (err) return res.sendStatus(403)

    req.user = user

    next()
  })
}