'use client';

/**
 * System Health - Realtime
 *
 * Dashboard de monitoramento em tempo real do socket server.
 * Rota: /system/health/realtime
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { BreadcrumbBar } from '@/components/breadcrumb-bar';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import {
  HealthOverview,
  ConnectionStats,
  RoomStats,
  InfrastructureStatus,
  ConnectionsTable,
  RoomsTable,
  DiagnosticPanel,
} from '@/components/health';
import { useHealthMetrics } from '@/hooks/use-health-metrics';

export default function RealtimeHealthPage() {
  const {
    metrics,
    connected,
    loading,
    error,
    refresh,
    fetchConnections,
    fetchRooms,
    disconnectSocket,
  } = useHealthMetrics();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <BreadcrumbBar
        items={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Status', href: '/app/system/health' },
        ]}
        currentPage="Tempo Real"
        onRefresh={refresh}
        actions={
          <>
            <Badge
              variant="outline"
              className={`gap-1 ${
                connected
                  ? 'bg-success/10 text-success border-success/20'
                  : 'bg-critical/10 text-critical border-critical/20'
              }`}
            >
              {connected ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
              {connected ? 'Live' : 'Offline'}
            </Badge>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </>
        }
        mobileActions={
          <DropdownMenuItem onClick={refresh} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </DropdownMenuItem>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3 md:p-4 rounded-lg border border-critical/50 bg-critical/10 text-critical text-sm">
            Erro de conexão: {error}
          </div>
        )}

        {/* Overview */}
        <HealthOverview metrics={metrics} connected={connected} loading={loading} />

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="metrics" className="text-xs sm:text-sm">Métricas</TabsTrigger>
            <TabsTrigger value="connections" className="text-xs sm:text-sm">Conexões</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs sm:text-sm">Rooms</TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-xs sm:text-sm">Diagnóstico</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <ConnectionStats metrics={metrics} loading={loading} />
              <RoomStats metrics={metrics} loading={loading} />
            </div>
            <InfrastructureStatus metrics={metrics} loading={loading} />
          </TabsContent>

          <TabsContent value="connections">
            <ConnectionsTable
              fetchConnections={fetchConnections}
              disconnectSocket={disconnectSocket}
            />
          </TabsContent>

          <TabsContent value="rooms">
            <RoomsTable fetchRooms={fetchRooms} />
          </TabsContent>

          <TabsContent value="diagnostics">
            <DiagnosticPanel
              metrics={metrics}
              refresh={refresh}
              disconnectSocket={disconnectSocket}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
