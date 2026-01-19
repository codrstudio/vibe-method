/**
 * Health HTTP Routes
 *
 * Motor: expõe endpoints HTTP para health checks e métricas.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import type { Server } from 'socket.io';
import { getRegistry } from './collectors/index.js';
import { RoomsCollector } from './collectors/rooms.js';
import type { HealthCheck, ReadinessCheck, LivenessCheck, ConnectionInfo } from './types.js';

// Timestamp de início
const startTime = Date.now();

// Versão do pacote (hardcoded para evitar problemas de import JSON)
const version = '0.1.0';

/**
 * Cria servidor HTTP para health endpoints
 */
export function createHealthServer(io: Server): ReturnType<typeof createServer> {
  const server = createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;

    try {
      // Route matching
      if (path === '/health' && req.method === 'GET') {
        await handleHealth(req, res, io);
      } else if (path === '/health/ready' && req.method === 'GET') {
        await handleReady(req, res, io);
      } else if (path === '/health/live' && req.method === 'GET') {
        handleLive(req, res);
      } else if (path === '/metrics' && req.method === 'GET') {
        await handleMetrics(req, res);
      } else if (path === '/admin/connections' && req.method === 'GET') {
        await handleConnections(req, res, io);
      } else if (path === '/admin/rooms' && req.method === 'GET') {
        await handleRooms(req, res, io);
      } else if (path.startsWith('/admin/disconnect/') && req.method === 'POST') {
        const socketId = path.replace('/admin/disconnect/', '');
        await handleDisconnect(req, res, io, socketId);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      console.error('[Health] Route error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  return server;
}

/**
 * GET /health - Basic health check
 */
async function handleHealth(
  _req: IncomingMessage,
  res: ServerResponse,
  io: Server
): Promise<void> {
  const registry = getRegistry();
  const infra = await registry.collectAll().then((m) => m.infrastructure);

  const status: HealthCheck['status'] = infra.redis.connected ? 'healthy' : 'degraded';

  const response: HealthCheck = {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: version || '0.0.0',
    services: {
      redis: infra.redis.connected ? 'connected' : 'disconnected',
      socketio: 'running',
    },
  };

  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
}

/**
 * GET /health/ready - Readiness probe
 */
async function handleReady(
  _req: IncomingMessage,
  res: ServerResponse,
  io: Server
): Promise<void> {
  const registry = getRegistry();
  const infra = await registry.collectAll().then((m) => m.infrastructure);

  const hubExists = io.of('/hub') !== undefined;
  const portalExists = io.of('/portal') !== undefined;

  const response: ReadinessCheck = {
    ready: infra.redis.connected && hubExists && portalExists,
    checks: {
      redis: infra.redis.connected,
      namespaces: hubExists && portalExists,
    },
  };

  const statusCode = response.ready ? 200 : 503;
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
}

/**
 * GET /health/live - Liveness probe
 */
function handleLive(_req: IncomingMessage, res: ServerResponse): void {
  const response: LivenessCheck = { live: true };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
}

/**
 * GET /metrics - Full metrics snapshot
 */
async function handleMetrics(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const registry = getRegistry();
  const metrics = await registry.collectAll();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(metrics, null, 2));
}

/**
 * GET /admin/connections - List active connections
 */
async function handleConnections(
  _req: IncomingMessage,
  res: ServerResponse,
  io: Server
): Promise<void> {
  const connections: ConnectionInfo[] = [];

  // Iterar por todos os namespaces
  const namespaces = ['/hub', '/portal', '/admin'];

  for (const nsName of namespaces) {
    const nsp = io.of(nsName);
    nsp.sockets.forEach((socket) => {
      const user = socket.data?.user;
      connections.push({
        id: socket.id,
        namespace: nsName,
        userId: user?.id || 'anonymous',
        connectedAt: socket.handshake.time,
        rooms: Array.from(socket.rooms).filter((r) => r !== socket.id),
        lastHeartbeat: socket.data?.lastHeartbeat || null,
      });
    });
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ connections }));
}

/**
 * GET /admin/rooms - List rooms
 */
async function handleRooms(
  _req: IncomingMessage,
  res: ServerResponse,
  io: Server
): Promise<void> {
  const roomsCollector = new RoomsCollector(io);
  const rooms = await roomsCollector.listRooms();

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ rooms }));
}

/**
 * POST /admin/disconnect/:socketId - Force disconnect
 */
async function handleDisconnect(
  _req: IncomingMessage,
  res: ServerResponse,
  io: Server,
  socketId: string
): Promise<void> {
  // Procurar socket em todos os namespaces
  const namespaces = ['/hub', '/portal', '/admin'];
  let found = false;

  for (const nsName of namespaces) {
    const nsp = io.of(nsName);
    const socket = nsp.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
      found = true;
      break;
    }
  }

  if (found) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, socketId }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Socket not found', socketId }));
  }
}
