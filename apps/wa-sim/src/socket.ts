/**
 * WhatsApp Simulator Socket.IO Server
 * Broadcast de eventos para clientes (wa-sim-ui)
 */

import { Server } from 'socket.io'
import { simulatorState } from './state.js'
import type { Server as HttpServer } from 'http'

let io: Server | null = null

export function initSocketServer(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:8004', 'http://localhost:8000', 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id)

    // Cliente entra em uma sala especifica da instancia
    socket.on('join:instance', (instanceName: string) => {
      socket.join(instanceName)
      console.log(`[Socket] ${socket.id} joined ${instanceName}`)
    })

    // Cliente sai da sala
    socket.on('leave:instance', (instanceName: string) => {
      socket.leave(instanceName)
      console.log(`[Socket] ${socket.id} left ${instanceName}`)
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Client disconnected:', socket.id)
    })
  })

  // =========================================================================
  // Eventos do estado -> broadcast para clientes
  // =========================================================================

  simulatorState.on('message:inbound', ({ instance, message }) => {
    io?.to(instance.instanceName).emit('message:new', {
      instanceName: instance.instanceName,
      message
    })
  })

  simulatorState.on('message:outbound', ({ instance, message }) => {
    io?.to(instance.instanceName).emit('message:new', {
      instanceName: instance.instanceName,
      message
    })
  })

  simulatorState.on('message:status_updated', ({ instance, message }) => {
    io?.to(instance.instanceName).emit('message:status', {
      instanceName: instance.instanceName,
      messageId: message.id,
      status: message.status
    })
  })

  simulatorState.on('instance:connected', (instance) => {
    io?.emit('instance:status', {
      instanceName: instance.instanceName,
      status: 'connected'
    })
  })

  simulatorState.on('instance:disconnected', ({ instance }) => {
    io?.emit('instance:status', {
      instanceName: instance.instanceName,
      status: 'disconnected'
    })
  })

  simulatorState.on('instance:created', (instance) => {
    io?.emit('instance:created', {
      instanceName: instance.instanceName,
      instanceId: instance.instanceId,
      status: instance.status
    })
  })

  simulatorState.on('instance:deleted', (instance) => {
    io?.emit('instance:deleted', {
      instanceName: instance.instanceName
    })
  })

  return io
}

export function getIO() {
  return io
}
