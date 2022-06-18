/**
 * Main backend server. REST API
 * 
 * Responsible for serving content to users.
 * 
 * User sensitive endpoints must use auth.authenticateToken
 * middleware to authenticate users' JWT tokens.
 * Client-side should store JWT access & refresh tokens.
 * Clients must pass JWT access token through authorization
 * header with type Bearer Token?
 */

const express = require('express');
const passport = require('passport');
const cors = require('cors')
require('dotenv').config() // Environment variables stored in .env file


const port = 5500;

const app = express();

//Middleware
app.use(express.json());
app.use(cors());
app.use(passport.initialize());
require('./services/googleStrategy');
const auth = require('./services/jwtAuth');

/// TEST ENDPOINTS START
app.get("/dashboard", auth.authenticateToken, (req, res) => {
  
  res.send(`Auth Successful. Welcome, ${JSON.stringify(req.user)}!
  <form action="/logout" method="post">
    <button type="submit">Logout</button>
  </form>`);
});

app.get('/', (req, res) => {
  res.send(`<h1>Hello world!<h1/> <a href="http://localhost:6500/auth/google">Google Login<a/>`);
})

app.get('/login', (req, res) => {
  res.send(`<h1>Login or smt<h1/><a href="http://localhost:6500/auth/google">Google Login<a/>`);
})
/// TEST ENDPOINTS END

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
