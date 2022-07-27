const express = require('express');
const passport = require('passport');
const cors = require('cors')
const cookieParser = require('cookie-parser');
require('dotenv').config() // Environment variables stored in .env file

const auth = require('./services/jwtAuth');
const db = require('./db');

const port = process.env.PORT || 6500;

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://scheduler.nathandong.com',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
require('./services/googleStrategy');

const temp = require('./services/webSockets');
const io = temp.setUpWebSockets(app, port)
require('./version/v1')(app, db, auth, passport, io);

// app.listen(port, () => {
//   console.log(`Listening on http://localhost:${port}/`)
// })
