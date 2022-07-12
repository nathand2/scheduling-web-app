const express = require('express');
const passport = require('passport');
const cors = require('cors')
const cookieParser = require('cookie-parser');
require('dotenv').config() // Environment variables stored in .env file

const auth = require('./services/jwtAuth');
const db = require('./db');

const port = 6500;

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());
require('./services/googleStrategy');

require('./version/v1')(app, db, auth, passport);
require('./services/webSockets')(app);

app.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
