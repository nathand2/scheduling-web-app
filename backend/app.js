const express = require('express');
const passport = require('passport');
require('dotenv').config() // Environment variables stored in .env file

const db = require('./db');
const auth = require('./services/jwtAuth');

const port = 5500;

const app = express();

//Middleware
app.use(express.json());
app.use(passport.initialize());
require('./services/googleStrategy');

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

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
