/**
 * Connections Metrics Collector
 *
 * Motor: coleta métricas de conexões ativas e taxas.
 */

import type { Server } from 'socket.io';
import type { ConnectionMetrics, MetricsCollector } from '../types.js';

/**
 * Ring buffer para calcular taxas por minuto
 */
class RateCounter {
  private timestamps: number[] = [];
  private windowMs: number;

  constructor(windowMs: number = 60000) {
    this.windowMs = windowMs;
  }

  record(): void {
    this.timestamps.push(Date.now());
    this.cleanup();
  }

  getRate(): number {
    this.cleanup();
    return this.timestamps.length;
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);
  }

  reset(): void {
    this.timestamps = [];
  }
}

export class ConnectionsCollector implements MetricsCollector<ConnectionMetrics> {
  readonly name = 'connections';
  private io: Server;
  private connectRate = new RateCounter();
  private disconnectRate = new RateCounter();

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Registra uma nova conexão
   */
  recordConnect(): void {
    this.connectRate.record();
  }

  /**
   * Registra uma desconexão
   */
  recordDisconnect(): void {
    this.disconnectRate.record();
  }

  async collect(): Promise<ConnectionMetrics> {
    const hubNsp = this.io.of('/hub');
    const portalNsp = this.io.of('/portal');
    const adminNsp = this.io.of('/admin');

    const hubCount = hubNsp.sockets.size;
    const portalCount = portalNsp.sockets.size;
    const adminCount = adminNsp.sockets.size;

    return {
      total: hubCount + portalCount + adminCount,
      byNamespace: {
        hub: hubCount,
        portal: portalCount,
        admin: adminCount,
      },
      rates: {
        connects1m: this.connectRate.getRate(),
        disconnects1m: this.disconnectRate.getRate(),
      },
    };
  }

  reset(): void {
    this.connectRate.reset();
    this.disconnectRate.reset();
  }
}
