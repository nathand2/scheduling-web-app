const express = require('express');
const passport = require('passport');
require('dotenv').config() // Environment variables stored in .env file

const db = require('./db');
// const jwtAuth = require('./services/jwtAuth');

const port = 5500;

const app = express();

//Middleware
app.use(passport.initialize());
require('./services/googleStrategy');

// Don't want to add serializers because don't want to use session. Want to use JWT.
// passport.serializeUser( (user, done) => {
//   done(null, user)
// });
// passport.deserializeUser((user, done) => {
//   done (null, user)
// });

app.get('/auth/google',
  passport.authenticate('google', { scope: [ 'email', 'profile' ]})
);

app.get('/auth/google/callback', passport.authenticate( 'google', {
  // successRedirect: '/dashboard',
  failureRedirect: '/login',
  session: false
}), (req, res) => {
  console.log("Successful login? User stuff:", req.user);
  res.redirect("/dashboard");
});

// Checks authentication using Express Session
// If auth successful, redirects to passport's callbackURL
const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next()
  }
  res.redirect("/login")
};

app.get("/dashboard", checkAuthenticated, (req, res) => {
  // jwtAuth.generateAccessToken(req.user.id);
  // if (null === req.authData) {
  //   res.sendStatus(403);
  // } else {
  //   // res.json(req.authData);
  //   res.send(`Auth Successful. Welcome, ${JSON.stringify(req.user)}<br/>${JSON.stringify(req.session)}!
  // <form action="/logout" method="post">
  //   <button type="submit">Logout</button>
  // </form>`);
  // }
  res.send(`Auth Successful. Welcome, ${JSON.stringify(req.user)}<br/>${JSON.stringify(req.session)}!
  <form action="/logout" method="post">
    <button type="submit">Logout</button>
  </form>`);

  
});


app.post("/logout", (req,res, next) => {
  // Async method with callback
  req.logOut( (err) => {
    if (err) { return next(err); }
    res.redirect('/login');
    console.log(`-------> User Logged out`)
    });
})

app.get('/', (req, res) => {
  res.send(`<h1>Hello world!<h1/> <a href="/auth/google">Google Login<a/>`);
})

app.get('/login', (req, res) => {
  res.send(`<h1>Login or smt<h1/><a href="/auth/google">Google Login<a/>`);
})

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
