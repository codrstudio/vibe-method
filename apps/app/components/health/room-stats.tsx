'use client';

/**
 * Room Stats Component
 *
 * Métricas de rooms ativas.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { MetricsSnapshot } from '@/lib/socket';

interface RoomStatsProps {
  metrics: MetricsSnapshot | null;
  loading: boolean;
}

export function RoomStats({ metrics, loading }: RoomStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const rooms = metrics?.rooms;
  const prefixes = rooms?.byPrefix || {};

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Rooms</CardTitle>
        <Badge variant="secondary">{rooms?.total || 0} total</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Por prefixo */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Por tipo</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(prefixes).map(([prefix, count]) => (
              <Badge key={prefix} variant="outline">
                {prefix}: {count}
              </Badge>
            ))}
            {Object.keys(prefixes).length === 0 && (
              <span className="text-sm text-muted-foreground">Nenhuma room ativa</span>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Tamanho médio</span>
            <span>{rooms?.avgSize.toFixed(1) || 0}</span>
          </div>
          {rooms?.largest && (
            <div className="flex items-center justify-between text-sm">
              <span>Maior room</span>
              <span className="text-muted-foreground truncate max-w-32">
                {rooms.largest.name} ({rooms.largest.size})
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
