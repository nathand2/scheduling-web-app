/**
 * Version 1 Socket.IO API.
 * Authenticates the access token and its httpOnly fingerprint before allowing
 * a connection, then verifies session membership before joining a room.
 */
import type { NextFunction } from 'express'
import type { Server, Socket } from 'socket.io'

const cookie = require('cookie') as typeof import('cookie')

interface AuthenticatedUser {
  userId: number
  displayName: string
  type: 'GOOGLE' | 'LOCAL'
  hash: string
}

interface SessionDatabase {
  getUserSessionByUserIdAndSessionCode(userId: number, sessionCode: string): Promise<unknown[]>
}

interface SocketAuth {
  authenticateToken: (
    this: SocketAuth,
    request: { headers: { authorization?: string }; cookies: Record<string, string> },
    response: { locals: { user?: AuthenticatedUser }; sendStatus: (status: number) => void },
    next: NextFunction
  ) => void
}

declare module 'socket.io' {
  interface SocketData {
    user: AuthenticatedUser
  }
}

module.exports = (_app: unknown, db: SessionDatabase, auth: SocketAuth, _passport: unknown, io: Server): void => {
  io.use((socket: Socket, next: (error?: Error) => void) => {
    const token: unknown = socket.handshake.auth?.token
    const cookieHeader = socket.handshake.headers.cookie
    const cookies = cookie.parse(typeof cookieHeader === 'string' ? cookieHeader : '')
    const req = {
      headers: { authorization: typeof token === 'string' ? `token ${token}` : '' },
      cookies
    }
    const res: { locals: { user?: AuthenticatedUser }; sendStatus: (status: number) => void } = {
      locals: {},
      sendStatus: (status) => {
        const error = new Error('Unauthorized') as Error & { data: { status: number } }
        error.data = { status }
        next(error)
      }
    }

    auth.authenticateToken.call(auth, req, res, () => {
      if (!res.locals.user) {
        next(new Error('Unauthorized'))
        return
      }
      socket.data.user = res.locals.user
      next()
    })
  })

  io.on('connection', (socket: Socket) => {
    socket.on('room', async (room: unknown) => {
      if (typeof room !== 'string' || !room.trim()) return
      try {
        const userSessions = await db.getUserSessionByUserIdAndSessionCode(socket.data.user.userId, room)
        if (userSessions.length === 0) {
          socket.emit('error', { message: 'Not authorized for this session' })
          return
        }

        await socket.join(room)
        socket.to(room).emit('message', 'Someone joined the room')
        console.log('Joined session:', room)
      } catch (err) {
        console.error('Unable to join session room:', err)
        socket.emit('error', { message: 'Unable to join session' })
      }
    })

    socket.on('disconnect', (reason: string) => console.log(reason))
  })
}
