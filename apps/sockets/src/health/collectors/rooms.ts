/**
 * Rooms Metrics Collector
 *
 * Motor: coleta métricas de rooms ativas.
 */

import type { Server } from 'socket.io';
import type { RoomMetrics, MetricsCollector, RoomInfo } from '../types.js';

export class RoomsCollector implements MetricsCollector<RoomMetrics> {
  readonly name = 'rooms';
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  async collect(): Promise<RoomMetrics> {
    const adapter = this.io.sockets.adapter;
    const rooms = adapter.rooms;
    const sids = adapter.sids;

    // Filtrar rooms que não são socket IDs (rooms reais vs auto-rooms)
    const realRooms = new Map<string, Set<string>>();

    rooms.forEach((members, roomName) => {
      // Se o room name é um socket ID, ignorar (auto-room)
      if (!sids.has(roomName)) {
        realRooms.set(roomName, members);
      }
    });

    // Calcular métricas por prefixo
    const byPrefix: Record<string, number> = {};
    let totalSize = 0;
    let largest: { name: string; size: number } | null = null;

    realRooms.forEach((members, roomName) => {
      const size = members.size;
      totalSize += size;

      // Extrair prefixo (parte antes do primeiro :)
      const prefix = roomName.includes(':') ? roomName.split(':')[0] : 'other';
      byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;

      // Track maior room
      if (!largest || size > largest.size) {
        largest = { name: roomName, size };
      }
    });

    const roomCount = realRooms.size;

    return {
      total: roomCount,
      byPrefix,
      avgSize: roomCount > 0 ? Math.round((totalSize / roomCount) * 100) / 100 : 0,
      largest,
    };
  }

  /**
   * Lista detalhada de rooms (para endpoint admin)
   */
  async listRooms(): Promise<RoomInfo[]> {
    const adapter = this.io.sockets.adapter;
    const rooms = adapter.rooms;
    const sids = adapter.sids;

    const result: RoomInfo[] = [];

    rooms.forEach((members, roomName) => {
      if (!sids.has(roomName)) {
        result.push({
          name: roomName,
          size: members.size,
          members: Array.from(members),
        });
      }
    });

    // Ordenar por tamanho decrescente
    return result.sort((a, b) => b.size - a.size);
  }
}
