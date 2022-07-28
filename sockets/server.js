/**
 * Web Socket Server
 * Keeps track of session changes for real-time updates.
 */

const express = require('express');
const app = express();
app.use(express.json());
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const port = process.env.PORT || 7500;
const resource = "";

const io = new Server(server, {
  cors: {
    // origins: ["https://scheduler.nathandong.com", "https://nathandong.com"],
    methods: ['POST', 'GET'],
    credentials: true
  },
  allowEIO3: true,
  secure: true
});

// handle incoming connections from clients
io.on('connection', function(socket) {
    // once a client has connected, we expect to get a ping from them saying what room they want to join
    socket.on('room', function(room) {
      io.in(room).emit('message', 'Someone joined the room');
      console.log("Joined session:", room)
      socket.join(room);
    });
    socket.on('disconnect',(reason)=>{
      console.log(reason)
    })
});

app.get(resource + '/', async (req, res) => {
  res.json({stuff: "home"})
})

app.get(resource + '/test', async (req, res) => {
  res.json({stuff: "potato"})
})

app.delete(resource + "/sessiontimerange", async (req, res) => {
  let sessionTimeRangeId, sessionCode;
  console.log("Delete body:", req.body)

  try {
    ({sessionTimeRangeId, sessionCode} = req.body)
  } catch (err) {
    console.log("Invalid body format")
    return res.sendStatus(400)
  }
  try {
    io.in(sessionCode).emit("deleteSessionTimeRange", {sessionTimeRangeId: sessionTimeRangeId});  // Emit message to people in session.
    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400); // Client Error
  }
});

app.post(resource + "/sessiontimerange", async (req, res) => {
  let sessionTimeRange, sessionCode;
  console.log("Req body:", req.body)
  try {
    ({sessionTimeRange, sessionCode} = req.body)
  } catch (err) {
    console.log("Invalid body format", {sessionTimeRange, sessionCode})
    return res.sendStatus(400)
  }
  try {
    io.in(sessionCode).emit("postSessionTimeRange", sessionTimeRange);  // Emit message to people in session.
    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400); // Client Error
  }
});

app.post(resource + "/usersession", async (req, res) => {
  let userSessionData, sessionCode;
  try {
    ({userSessionData, sessionCode} = req.body)
  } catch (err) {
    console.log("Invalid body format")
    return res.sendStatus(400)
  }

  try {
    io.in(sessionCode).emit("joinSession", userSessionData);  // Emit message to people in session.
    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400); // Client Error
  }
});

// io.in(sessionCode).emit("joinSession", userSession[0]);  // Emit message to people in session.

/**
 * someone adds dt -> api.post
 * api.post emits to room new dt
 * people in session get emission -> independent query
 * 
 */

/**
 * Post to REST api
 * Rest api request to socket api
 * socket api messages all in session
 */

server.listen(port);
