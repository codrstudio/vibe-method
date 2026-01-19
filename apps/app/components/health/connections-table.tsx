'use client';

/**
 * Connections Table Component
 *
 * Lista de conexões ativas com ações.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, X } from 'lucide-react';
import type { ConnectionInfo } from '@/lib/socket';

interface ConnectionsTableProps {
  fetchConnections: () => Promise<ConnectionInfo[]>;
  disconnectSocket: (socketId: string) => Promise<boolean>;
}

export function ConnectionsTable({ fetchConnections, disconnectSocket }: ConnectionsTableProps) {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const data = await fetchConnections();
    setConnections(data);
    setLoading(false);
  };

  const handleDisconnect = async (socketId: string) => {
    const success = await disconnectSocket(socketId);
    if (success) {
      setConnections((prev) => prev.filter((c) => c.id !== socketId));
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Conexões Ativas</CardTitle>
          <Skeleton className="h-8 w-8" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Conexões Ativas ({connections.length})</CardTitle>
        <Button variant="outline" size="icon" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {connections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma conexão ativa
          </p>
        ) : (
          <div className="space-y-2">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-1 rounded">{conn.id.slice(0, 12)}...</code>
                    <Badge variant="outline">{conn.namespace}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    User: {conn.userId} | Rooms: {conn.rooms.length}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDisconnect(conn.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
