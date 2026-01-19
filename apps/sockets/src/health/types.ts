/**
 * Health Metrics Types
 *
 * Artefato: define a estrutura dos dados de métricas.
 * Motor: collectors que implementam a coleta.
 */

// =============================================================================
// Connection Metrics
// =============================================================================

export interface ConnectionMetrics {
  total: number;
  byNamespace: {
    hub: number;
    portal: number;
    admin: number;
  };
  rates: {
    connects1m: number;
    disconnects1m: number;
  };
}

// =============================================================================
// Event Metrics
// =============================================================================

export interface EventMetrics {
  total: {
    inbound: number;
    outbound: number;
  };
  throughput1m: number;
  latency: {
    avg: number;
    p95: number;
  };
  byType: Record<string, number>;
}

// =============================================================================
// Room Metrics
// =============================================================================

export interface RoomMetrics {
  total: number;
  byPrefix: Record<string, number>;
  avgSize: number;
  largest: {
    name: string;
    size: number;
  } | null;
}

// =============================================================================
// Presence Metrics
// =============================================================================

export interface PresenceMetrics {
  online: number;
  away: number;
  staleClients: number;
}

// =============================================================================
// Infrastructure Metrics
// =============================================================================

export interface InfrastructureMetrics {
  redis: {
    connected: boolean;
    latency: number;
  };
  server: {
    uptime: number;
    memory: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
}

// =============================================================================
// Full Metrics Snapshot
// =============================================================================

export interface MetricsSnapshot {
  timestamp: number;
  connections: ConnectionMetrics;
  events: EventMetrics;
  rooms: RoomMetrics;
  presence: PresenceMetrics;
  infrastructure: InfrastructureMetrics;
}

// =============================================================================
// Health Status
// =============================================================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheck {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    redis: 'connected' | 'disconnected';
    socketio: 'running' | 'stopped';
  };
}

export interface ReadinessCheck {
  ready: boolean;
  checks: {
    redis: boolean;
    namespaces: boolean;
  };
}

export interface LivenessCheck {
  live: boolean;
}

// =============================================================================
// Collector Interface
// =============================================================================

export interface MetricsCollector<T> {
  name: string;
  collect(): Promise<T>;
  reset?(): void;
}

// =============================================================================
// Admin Endpoints Types
// =============================================================================

export interface ConnectionInfo {
  id: string;
  namespace: string;
  userId: string;
  connectedAt: string;
  rooms: string[];
  lastHeartbeat: string | null;
}

export interface RoomInfo {
  name: string;
  size: number;
  members: string[];
}
