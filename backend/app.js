const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const session = require('express-session')
require('dotenv').config() // Environment variables stored in .env file

const db = require('./db');

const port = 5500;
// Passport Google OAuth environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const app = express();

//Middleware
app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false ,
  saveUninitialized: true
}))
app.use(passport.initialize());
app.use(passport.session());

// Google Auth. Creates new user account if necessary. Authenticates user.
const authUser = (request, accessToken, refreshToken, profile, done) => {
  console.log(profile);
  try {
    db.googleAuth(profile.id);
  } catch (err) {
    // Don't authenticate if error
    console.log("Database Connection Error");
    return;
  }
  return done(null, profile); // Authenticates anyone with google acc.
};

// Passport config
passport.use(new GoogleStrategy({
  clientID:     GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5500/auth/google/callback",
  passReqToCallback   : true
}, authUser));

passport.serializeUser( (user, done) => {
  done(null, user)
});
passport.deserializeUser((user, done) => {
  done (null, user)
});

app.get('/auth/google',
  passport.authenticate('google', { scope: [ 'email', 'profile' ]
}));

app.get('/auth/google/callback', passport.authenticate( 'google', {
  successRedirect: '/dashboard',
  failureRedirect: '/login'
}));

// Checks authentication using Express Session
// If auth successful, redirects to passport's callbackURL
const checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next() }
  res.redirect("/login")
};

app.get("/dashboard", checkAuthenticated, (req, res) => {
  res.send(`Auth Successful. Welcome, ${req.user.displayName}!
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
