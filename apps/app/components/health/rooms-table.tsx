'use client';

/**
 * Rooms Table Component
 *
 * Lista de rooms ativas.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RefreshCw, ChevronDown } from 'lucide-react';
import type { RoomInfo } from '@/lib/socket';

interface RoomsTableProps {
  fetchRooms: () => Promise<RoomInfo[]>;
}

export function RoomsTable({ fetchRooms }: RoomsTableProps) {
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRooms, setOpenRooms] = useState<Set<string>>(new Set());

  const refresh = async () => {
    setLoading(true);
    const data = await fetchRooms();
    setRooms(data);
    setLoading(false);
  };

  const toggleRoom = (roomName: string) => {
    setOpenRooms((prev) => {
      const next = new Set(prev);
      if (next.has(roomName)) {
        next.delete(roomName);
      } else {
        next.add(roomName);
      }
      return next;
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rooms</CardTitle>
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
        <CardTitle>Rooms ({rooms.length})</CardTitle>
        <Button variant="outline" size="icon" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma room ativa
          </p>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <Collapsible
                key={room.name}
                open={openRooms.has(room.name)}
                onOpenChange={() => toggleRoom(room.name)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openRooms.has(room.name) ? 'rotate-180' : ''
                        }`}
                      />
                      <code className="text-sm">{room.name}</code>
                    </div>
                    <Badge variant="secondary">{room.size}</Badge>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 pt-1 pl-9">
                    <p className="text-xs text-muted-foreground mb-2">Membros:</p>
                    <div className="flex flex-wrap gap-1">
                      {room.members.slice(0, 10).map((member) => (
                        <code
                          key={member}
                          className="text-xs bg-muted px-1 rounded"
                        >
                          {member.slice(0, 8)}...
                        </code>
                      ))}
                      {room.members.length > 10 && (
                        <span className="text-xs text-muted-foreground">
                          +{room.members.length - 10} mais
                        </span>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
