const express = require('express');
const passport = require('passport');
require('dotenv').config() // Environment variables stored in .env file

// const db = require('./db');
const auth = require('./services/jwtAuth');

const port = 6500;

const app = express();

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
  console.log("Successful login? User stuff:", req.user);
  const accessToken = auth.generateAccessToken(req.user.id);
  res.json({accessToken: accessToken});
});

app.post("/logout", (req,res, next) => {
  // Async method with callback
  req.logOut( (err) => {
    if (err) { return next(err); }
    res.redirect('/login');
    console.log(`-------> User Logged out`)
    });
})

// app.get('/login', (req, res) => {
//   res.redirect('/')
//   res.send(`<h1>Login or smt<h1/><a href="/auth/google">Google Login<a/>`);
// })

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
