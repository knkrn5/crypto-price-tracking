import type { Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'
import type { PriceSnapshot } from '../services/priceService.js'
import type { AlertNotificationPayload } from '../services/alertService.js'
import { logger } from '../utils/logger.js'

const userToSockets = new Map<string, Set<string>>()
const socketToUser = new Map<string, string>()

const register = (socketId: string, userId: string) => {
  socketToUser.set(socketId, userId)
  const sockets = userToSockets.get(userId) ?? new Set<string>()
  sockets.add(socketId)
  userToSockets.set(userId, sockets)
}

const unregister = (socketId: string) => {
  const userId = socketToUser.get(socketId)
  if (!userId) {
    return
  }
  socketToUser.delete(socketId)
  const sockets = userToSockets.get(userId)
  if (!sockets) {
    return
  }
  sockets.delete(socketId)
  if (!sockets.size) {
    userToSockets.delete(userId)
  }
}

export const createSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'DELETE'],
    },
  })

  io.on('connection', (socket: Socket) => {
    const handshakeUser = socket.handshake.auth?.userId ?? socket.handshake.query.userId
    const userId = typeof handshakeUser === 'string' && handshakeUser.trim().length ? handshakeUser : socket.id

    register(socket.id, userId)
    logger.debug('Socket connected', { socketId: socket.id, userId })

    socket.emit('connection:ack', { socketId: socket.id, userId })

    socket.on('client:register', (payload: { userId?: string }) => {
      if (payload?.userId && typeof payload.userId === 'string' && payload.userId.trim().length) {
        unregister(socket.id)
        register(socket.id, payload.userId)
        logger.debug('Socket user re-registered', { socketId: socket.id, userId: payload.userId })
      }
    })

    socket.on('disconnect', () => {
      unregister(socket.id)
      logger.debug('Socket disconnected', { socketId: socket.id, userId })
    })
  })

  const emitPriceUpdate = (snapshot: PriceSnapshot) => {
    io.emit('price:update', snapshot)
  }

  const emitAlert = (userId: string, payload: AlertNotificationPayload) => {
    const sockets = userToSockets.get(userId)
    if (!sockets?.size) {
      return
    }
    sockets.forEach((socketId) => {
      io.to(socketId).emit('alert:trigger', payload)
    })
  }

  return {
    io,
    emitPriceUpdate,
    emitAlert,
  }
}
