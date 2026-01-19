'use client';

/**
 * Health Overview Component
 *
 * Cards de status geral do sistema.
 */

import { Activity, Wifi, Clock, Database } from 'lucide-react';
import { MetricCard } from './metric-card';
import { StatusBadge } from './status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricsSnapshot } from '@/lib/socket';

interface HealthOverviewProps {
  metrics: MetricsSnapshot | null;
  connected: boolean;
  loading: boolean;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function HealthOverview({ metrics, connected, loading }: HealthOverviewProps) {
  const status = !connected
    ? 'disconnected'
    : metrics?.infrastructure.redis.connected
      ? 'healthy'
      : 'degraded';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Status Geral */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <StatusBadge status={status} />
          <p className="text-xs text-muted-foreground mt-2">
            {connected ? 'Conectado ao servidor' : 'Desconectado'}
          </p>
        </CardContent>
      </Card>

      {/* Conexões */}
      <MetricCard
        title="Conexões"
        value={metrics?.connections.total ?? 0}
        description={`Hub: ${metrics?.connections.byNamespace.hub ?? 0} | Portal: ${metrics?.connections.byNamespace.portal ?? 0}`}
        icon={<Wifi className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />

      {/* Throughput */}
      <MetricCard
        title="Eventos/s"
        value={metrics?.events.throughput1m.toFixed(1) ?? '0'}
        description={`Latência: ${metrics?.events.latency.avg.toFixed(1) ?? 0}ms`}
        icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />

      {/* Uptime */}
      <MetricCard
        title="Uptime"
        value={metrics ? formatUptime(metrics.infrastructure.server.uptime) : '-'}
        description={`Redis: ${metrics?.infrastructure.redis.latency ?? 0}ms`}
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        loading={loading}
      />
    </div>
  );
}
