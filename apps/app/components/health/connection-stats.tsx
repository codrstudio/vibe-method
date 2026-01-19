'use client';

/**
 * Connection Stats Component
 *
 * Métricas detalhadas de conexões.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import type { MetricsSnapshot } from '@/lib/socket';

interface ConnectionStatsProps {
  metrics: MetricsSnapshot | null;
  loading: boolean;
}

export function ConnectionStats({ metrics, loading }: ConnectionStatsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conexões por Namespace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = metrics?.connections.total || 1;
  const hub = metrics?.connections.byNamespace.hub || 0;
  const portal = metrics?.connections.byNamespace.portal || 0;
  const admin = metrics?.connections.byNamespace.admin || 0;

  const namespaces = [
    { name: '/hub', value: hub, color: 'bg-blue-500' },
    { name: '/portal', value: portal, color: 'bg-green-500' },
    { name: '/admin', value: admin, color: 'bg-purple-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conexões por Namespace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {namespaces.map((ns) => (
          <div key={ns.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{ns.name}</span>
              <span className="text-muted-foreground">{ns.value}</span>
            </div>
            <Progress
              value={(ns.value / total) * 100}
              className="h-2"
            />
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span>Conexões/min</span>
            <span className="text-green-600">+{metrics?.connections.rates.connects1m || 0}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span>Desconexões/min</span>
            <span className="text-red-600">-{metrics?.connections.rates.disconnects1m || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
