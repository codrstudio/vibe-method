'use client';

/**
 * Health Metrics Hook
 *
 * Gerencia conexão com o namespace /admin e recebe métricas em tempo real.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { type Socket } from 'socket.io-client';
import { createSocketConnection, type MetricsSnapshot, type ConnectionInfo, type RoomInfo } from '@/lib/socket';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8001';

interface UseHealthMetricsReturn {
  metrics: MetricsSnapshot | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  fetchConnections: () => Promise<ConnectionInfo[]>;
  fetchRooms: () => Promise<RoomInfo[]>;
  disconnectSocket: (socketId: string) => Promise<boolean>;
}

export function useHealthMetrics(): UseHealthMetricsReturn {
  const socketRef = useRef<Socket | null>(null);
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conectar ao namespace /admin (usa HTTP-only cookie para auth)
  useEffect(() => {
    const socket = createSocketConnection('/admin');

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      // Solicitar snapshot inicial
      socket.emit('metrics:request');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      setConnected(false);
      setLoading(false);
    });

    // Receber snapshot inicial
    socket.on('metrics:snapshot', (data: MetricsSnapshot) => {
      setMetrics(data);
      setLoading(false);
    });

    // Receber atualizações periódicas
    socket.on('metrics:update', (data: MetricsSnapshot) => {
      setMetrics(data);
    });

    socket.connect();
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  // Solicitar refresh manual
  const refresh = useCallback(() => {
    if (socketRef.current?.connected) {
      setLoading(true);
      socketRef.current.emit('metrics:request');
    }
  }, []);

  // Buscar lista de conexões via HTTP
  const fetchConnections = useCallback(async (): Promise<ConnectionInfo[]> => {
    try {
      const res = await fetch(`${SOCKET_URL}/admin/connections`);
      if (!res.ok) throw new Error('Failed to fetch connections');
      const data = await res.json();
      return data.connections;
    } catch (err) {
      console.error('Error fetching connections:', err);
      return [];
    }
  }, []);

  // Buscar lista de rooms via HTTP
  const fetchRooms = useCallback(async (): Promise<RoomInfo[]> => {
    try {
      const res = await fetch(`${SOCKET_URL}/admin/rooms`);
      if (!res.ok) throw new Error('Failed to fetch rooms');
      const data = await res.json();
      return data.rooms;
    } catch (err) {
      console.error('Error fetching rooms:', err);
      return [];
    }
  }, []);

  // Desconectar socket específico
  const disconnectSocket = useCallback(async (socketId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${SOCKET_URL}/admin/disconnect/${socketId}`, {
        method: 'POST',
      });
      return res.ok;
    } catch (err) {
      console.error('Error disconnecting socket:', err);
      return false;
    }
  }, []);

  return {
    metrics,
    connected,
    loading,
    error,
    refresh,
    fetchConnections,
    fetchRooms,
    disconnectSocket,
  };
}
