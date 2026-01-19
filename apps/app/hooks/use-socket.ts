'use client';

/**
 * Socket Connection Hook
 *
 * Gerencia conexão socket com reconexão automática.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { type Socket } from 'socket.io-client';
import { createSocketConnection } from '@/lib/socket';

interface UseSocketOptions {
  token?: string;
  autoConnect?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export function useSocket(
  namespace: '/hub' | '/portal' | '/admin',
  options: UseSocketOptions = {}
): UseSocketReturn {
  const { token, autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!token) {
      setError('Token não fornecido');
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    const socket = createSocketConnection(namespace, token);

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      setError(err.message);
      setConnected(false);
    });

    socket.connect();
    socketRef.current = socket;
  }, [namespace, token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    socket: socketRef.current,
    connected,
    error,
    connect,
    disconnect,
  };
}
