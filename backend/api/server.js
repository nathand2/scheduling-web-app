/**
 * REST api server
 */
const express = require('express');
const passport = require('passport');
const cors = require('cors')
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

require('dotenv').config() // Environment variables stored in .env file

const auth = require('./services/jwtAuth');
const db = require('./db');

const port = process.env.PORT || 6500;

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://scheduler.nathandong.dev',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
require('./services/googleStrategy');

const resource = process.env.NODE_ENV === 'development' ? '' : '/scheduler';
const socketPath = `${resource}/socket/v1`;
const io = new Server(server, {
  path: socketPath,
  cors: {
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://scheduler.nathandong.dev',
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true
});

require('./version/v1')(app, db, auth, passport, io);
require('./version/v2')(app, db, auth, passport);
require('./socket/v1')(app, db, auth, passport, io);

app.get("/", async (req, res) => {
  res.json({hello: "world"})
})
app.get("/test/1", async (req, res) => {
  res.json({test: "1"})
})

server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}/`)
})
