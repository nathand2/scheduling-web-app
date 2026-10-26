/**
 * Version 1 Socket.IO API.
 * Authenticates the access token and its httpOnly fingerprint before allowing
 * a connection, then verifies session membership before joining a room.
 */
const cookie = require('cookie');

module.exports = (app, db, auth, passport, io) => {
  io.use((socket, next) => {
    const accessToken = socket.handshake.auth && socket.handshake.auth.token;
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const req = {
      headers: { authorization: accessToken ? `token ${accessToken}` : '' },
      cookies
    };
    const res = {
      locals: {},
      sendStatus: (status) => {
        const error = new Error('Unauthorized');
        error.data = { status };
        next(error);
      }
    };

    auth.authenticateToken.call(auth, req, res, () => {
      socket.data.user = res.locals.user;
      next();
    });
  });

  io.on('connection', (socket) => {
    socket.on('room', async (room) => {
      if (typeof room !== 'string' || !room.trim()) return;
      try {
        const userSessions = await db.getUserSessionByUserIdAndSessionCode(
          socket.data.user.userId,
          room
        );
        if (!userSessions || userSessions.length === 0) {
          socket.emit('error', { message: 'Not authorized for this session' });
          return;
        }

        await socket.join(room);
        socket.to(room).emit('message', 'Someone joined the room');
        console.log('Joined session:', room);
      } catch (err) {
        console.error('Unable to join session room:', err);
        socket.emit('error', { message: 'Unable to join session' });
      }
    });

    socket.on('disconnect', (reason) => console.log(reason));
  });
};
