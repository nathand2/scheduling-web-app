const http = require('http');
const socketIo = require("socket.io");

exports.setUpWebSockets = (app) => {

  console.log("Socket module connected")
  // TODO: Move Web Socket to different server.
  // Socket.io
  const server = http.createServer(app);
  // const io = socketIo(server);
  const io = socketIo(server, { 
    cors: {
      origin: 'http://localhost:3000'
    }
  }); //in case server and client run on different urls

  // handle incoming connections from clients
  io.on('connection', function(socket) {
    console.log("Connection to socket?")
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

  io.listen(8000);  // Web Socket listen on port 8000

  return io;

}