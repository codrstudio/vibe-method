/**
 * WhatsApp Simulator Server
 * Servidor Fastify standalone
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { simulatorRoutes } from './routes.js'

const PORT = parseInt(process.env.WA_SIM_PORT || '8003', 10)
const HOST = process.env.WA_SIM_HOST || '0.0.0.0'

const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production',
})

async function start() {
  // CORS
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  })

  // Rotas
  await fastify.register(simulatorRoutes)

  // Start
  try {
    await fastify.listen({ port: PORT, host: HOST })
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                   WA-SIM STARTED                      ║
╠═══════════════════════════════════════════════════════╣
║  WhatsApp Simulator (Fake Evolution API)              ║
║                                                       ║
║  Port: ${PORT}                                          ║
║  Status: http://localhost:${PORT}/status                ║
║  Health: http://localhost:${PORT}/health                ║
║                                                       ║
║  Instrumentation:                                     ║
║  - GET  /instances          List all                  ║
║  - POST /instances/:n/connect    Simulate QR scan     ║
║  - POST /instances/:n/message    Inject message       ║
║                                                       ║
║  Evolution Compatible:                                ║
║  - POST /instance/create                              ║
║  - GET  /instance/connectionState/:name               ║
║  - POST /message/sendText/:name                       ║
╚═══════════════════════════════════════════════════════╝
    `)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
