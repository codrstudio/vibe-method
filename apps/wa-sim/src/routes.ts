/**
 * WhatsApp Simulator Routes
 * Rotas de instrumentação para controle do simulador
 */

import type { FastifyPluginAsync } from 'fastify'
import { simulatorState } from './state.js'
import { simulatorApi } from './api.js'
import { webhookEmitter } from './webhook-emitter.js'

export const simulatorRoutes: FastifyPluginAsync = async (fastify) => {
  // ===========================================================================
  // Status e Health
  // ===========================================================================

  // Status geral do simulador
  fastify.get('/status', async () => {
    return {
      active: true,
      stats: simulatorState.getStats()
    }
  })

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', service: 'wa-sim' }
  })

  // ===========================================================================
  // Evolution API Compatible (para backbone rotear aqui)
  // ===========================================================================

  // Criar instância (Evolution compatible)
  fastify.post('/instance/create', async (request) => {
    const { instanceName, webhook, channelId, channelName } = request.body as {
      instanceName: string
      webhook?: string
      channelId?: string
      channelName?: string
    }

    return simulatorApi.createInstance(instanceName, webhook || '', channelId, channelName)
  })

  // Status de conexão (Evolution compatible)
  fastify.get('/instance/connectionState/:name', async (request, reply) => {
    const { name } = request.params as { name: string }

    try {
      return await simulatorApi.getConnectionStatus(name)
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message })
    }
  })

  // QR Code (Evolution compatible)
  fastify.get('/instance/connect/:name', async (request, reply) => {
    const { name } = request.params as { name: string }

    try {
      return await simulatorApi.getQrCode(name)
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message })
    }
  })

  // Enviar mensagem (Evolution compatible)
  fastify.post('/message/sendText/:name', async (request, reply) => {
    const { name } = request.params as { name: string }
    const { number, text } = request.body as { number: string; text: string }

    try {
      return await simulatorApi.sendTextMessage(name, number, text)
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message })
    }
  })

  // Restart instância (Evolution compatible)
  fastify.put('/instance/restart/:name', async (request, reply) => {
    const { name } = request.params as { name: string }

    try {
      await simulatorApi.restart(name)
      return { success: true }
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message })
    }
  })

  // Logout instância (Evolution compatible)
  fastify.delete('/instance/logout/:name', async (request, reply) => {
    const { name } = request.params as { name: string }

    try {
      await simulatorApi.logout(name)
      return { success: true }
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message })
    }
  })

  // Deletar instância (Evolution compatible)
  fastify.delete('/instance/delete/:name', async (request, reply) => {
    const { name } = request.params as { name: string }

    try {
      await simulatorApi.deleteInstance(name)
      return { success: true }
    } catch (error) {
      return reply.status(404).send({ error: (error as Error).message })
    }
  })

  // Listar instâncias (Evolution compatible)
  fastify.get('/instance/fetchInstances', async () => {
    return simulatorApi.listInstances()
  })

  // ===========================================================================
  // Rotas de Instrumentação (apenas simulador)
  // ===========================================================================

  // Listar todas as instâncias com detalhes
  fastify.get('/instances', async () => {
    return {
      data: simulatorState.listInstances().map(i => ({
        instanceName: i.instanceName,
        instanceId: i.instanceId,
        channelId: i.channelId,
        displayName: i.displayName,
        status: i.status,
        phoneNumber: i.phoneNumber,
        stats: i.stats,
        createdAt: i.createdAt
      }))
    }
  })

  // Detalhes de uma instância
  fastify.get('/instances/:name', async (request, reply) => {
    const { name } = request.params as { name: string }
    const instance = simulatorState.getInstance(name)

    if (!instance) {
      return reply.status(404).send({ error: 'Instance not found' })
    }

    return { data: instance }
  })

  // Simular conexão (operador "escaneia" QR)
  fastify.post('/instances/:name/connect', async (request, reply) => {
    const { name } = request.params as { name: string }
    const { phoneNumber } = request.body as { phoneNumber?: string }

    const instance = simulatorState.getInstance(name)
    if (!instance) {
      return reply.status(404).send({ error: 'Instance not found' })
    }

    const phone = phoneNumber || `+5511${Math.floor(Math.random() * 900000000 + 100000000)}`

    // Sequência de eventos (simula comportamento real)
    await webhookEmitter.emitConnectionUpdate(name, 'connecting')

    setTimeout(async () => {
      simulatorState.simulateConnection(name, phone)
      await webhookEmitter.emitConnectionUpdate(name, 'open')
    }, 1000)

    return { success: true, phoneNumber: phone }
  })

  // Simular desconexão
  fastify.post('/instances/:name/disconnect', async (request, reply) => {
    const { name } = request.params as { name: string }
    const { reason } = request.body as { reason?: number }

    const instance = simulatorState.getInstance(name)
    if (!instance) {
      return reply.status(404).send({ error: 'Instance not found' })
    }

    simulatorState.simulateDisconnection(name, reason ?? 401)
    await webhookEmitter.emitConnectionUpdate(name, 'close', reason ?? 401)

    return { success: true }
  })

  // Simular mensagem recebida
  fastify.post('/instances/:name/message', async (request, reply) => {
    const { name } = request.params as { name: string }
    const { from, text } = request.body as { from: string; text: string }

    const instance = simulatorState.getInstance(name)
    if (!instance) {
      return reply.status(404).send({ error: 'Instance not found' })
    }

    if (instance.status !== 'connected') {
      return reply.status(400).send({ error: 'Instance not connected' })
    }

    const message = simulatorState.addInboundMessage(name, from, text)
    if (!message) {
      return reply.status(500).send({ error: 'Failed to add message' })
    }

    await webhookEmitter.emitMessageUpsert(name, message)

    return { success: true, messageId: message.id }
  })

  // Histórico de mensagens
  fastify.get('/instances/:name/messages', async (request, reply) => {
    const { name } = request.params as { name: string }
    const { limit } = request.query as { limit?: string }

    const instance = simulatorState.getInstance(name)
    if (!instance) {
      return reply.status(404).send({ error: 'Instance not found' })
    }

    const messages = instance.messages.slice(-(parseInt(limit || '50')))

    return { data: messages }
  })
}
