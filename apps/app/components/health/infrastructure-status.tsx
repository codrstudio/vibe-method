'use client';

/**
 * Infrastructure Status Component
 *
 * Status de Redis e servidor.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Database, Server } from 'lucide-react';
import type { MetricsSnapshot } from '@/lib/socket';

interface InfrastructureStatusProps {
  metrics: MetricsSnapshot | null;
  loading: boolean;
}

export function InfrastructureStatus({ metrics, loading }: InfrastructureStatusProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Infraestrutura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const redis = metrics?.infrastructure.redis;
  const server = metrics?.infrastructure.server;
  const memoryPercent = server
    ? (server.memory.heapUsed / server.memory.heapTotal) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infraestrutura</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Redis */}
          <div className="space-y-3 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Redis</span>
              </div>
              <Badge
                variant="outline"
                className={redis?.connected
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-critical/10 text-critical border-critical/20'
                }
              >
                {redis?.connected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Latência: {redis?.latency ?? '-'}ms
            </div>
          </div>

          {/* Server */}
          <div className="space-y-3 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="font-medium">Servidor</span>
              </div>
              <Badge variant="outline">
                {server?.memory.heapUsed.toFixed(0) ?? 0} MB
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Heap Memory</span>
                <span>{memoryPercent.toFixed(0)}%</span>
              </div>
              <Progress value={memoryPercent} className="h-1" />
            </div>
            <div className="text-xs text-muted-foreground">
              RSS: {server?.memory.rss.toFixed(0) ?? 0} MB
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
