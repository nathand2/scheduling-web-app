const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const port = process.env.PORT || 7500;
const resource = "";

const io = new Server(server, {
  cors: {
    // origins: ["https://scheduler.nathandong.com", "https://nathandong.com"],
    origin: "*",
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

app.get(resource + '/test', async (req, res) => {
  res.json({stuff: "potato"})
})

server.listen(port);
