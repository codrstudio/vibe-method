'use client';

/**
 * WhatsApp Channel Hook
 *
 * Gerencia estado real-time de um canal WhatsApp.
 * Recebe atualizacoes de QR code, status de conexao e alertas.
 */

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './use-socket';

// =============================================================================
// Types
// =============================================================================

export type ChannelStatus =
  | 'disconnected'
  | 'qr_pending'
  | 'connecting'
  | 'connected'
  | 'degraded';

export interface WhatsAppChannelState {
  status: ChannelStatus;
  qrCode: string | null;
  qrCodeExpiresAt: string | null;
  phoneNumber: string | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
}

export interface WhatsAppAlert {
  channelId: string;
  channelName: string;
  type: 'degraded' | 'disconnected' | 'reconnected';
  message: string;
  reason: string | null;
  timestamp: string;
}

interface UseWhatsAppChannelOptions {
  channelId: string;
  initialStatus?: ChannelStatus;
  initialQrCode?: string | null;
  token?: string;
}

interface UseWhatsAppChannelReturn {
  state: WhatsAppChannelState;
  connected: boolean;
  error: string | null;
  joinChannel: () => void;
  leaveChannel: () => void;
}

// =============================================================================
// Hook
// =============================================================================

export function useWhatsAppChannel(
  options: UseWhatsAppChannelOptions
): UseWhatsAppChannelReturn {
  const { channelId, initialStatus = 'disconnected', initialQrCode = null, token } = options;

  const { socket, connected, error } = useSocket('/hub', { token, autoConnect: true });

  const [state, setState] = useState<WhatsAppChannelState>({
    status: initialStatus,
    qrCode: initialQrCode,
    qrCodeExpiresAt: null,
    phoneNumber: null,
    retryCount: 0,
    maxRetries: 5,
    lastError: null,
  });

  const joinChannel = useCallback(() => {
    if (socket && connected) {
      socket.emit('join:whatsapp', { channelId });
    }
  }, [socket, connected, channelId]);

  const leaveChannel = useCallback(() => {
    if (socket && connected) {
      socket.emit('leave:whatsapp', { channelId });
    }
  }, [socket, connected, channelId]);

  useEffect(() => {
    if (!socket || !connected) return;

    // Join the channel room
    socket.emit('join:whatsapp', { channelId });

    // Listen for QR code updates
    const handleQrUpdated = (data: {
      channelId: string;
      qrCode: string;
      expiresAt: string;
    }) => {
      if (data.channelId === channelId) {
        setState((prev) => ({
          ...prev,
          status: 'qr_pending',
          qrCode: data.qrCode,
          qrCodeExpiresAt: data.expiresAt,
        }));
      }
    };

    // Listen for connection status updates
    const handleConnectionUpdated = (data: {
      channelId: string;
      status: ChannelStatus;
      phoneNumber?: string | null;
      reason?: number;
      requiresQrCode?: boolean;
      retryCount?: number;
      maxRetries?: number;
      message?: string;
    }) => {
      if (data.channelId === channelId) {
        setState((prev) => ({
          ...prev,
          status: data.status,
          phoneNumber: data.phoneNumber ?? prev.phoneNumber,
          retryCount: data.retryCount ?? prev.retryCount,
          maxRetries: data.maxRetries ?? prev.maxRetries,
          lastError: data.message ?? null,
          // Clear QR code when connected
          qrCode: data.status === 'connected' ? null : prev.qrCode,
          qrCodeExpiresAt: data.status === 'connected' ? null : prev.qrCodeExpiresAt,
        }));
      }
    };

    socket.on('whatsapp:qr_updated', handleQrUpdated);
    socket.on('whatsapp:connection_updated', handleConnectionUpdated);

    return () => {
      socket.off('whatsapp:qr_updated', handleQrUpdated);
      socket.off('whatsapp:connection_updated', handleConnectionUpdated);
      socket.emit('leave:whatsapp', { channelId });
    };
  }, [socket, connected, channelId]);

  return {
    state,
    connected,
    error,
    joinChannel,
    leaveChannel,
  };
}

// =============================================================================
// Global Alerts Hook
// =============================================================================

interface UseWhatsAppAlertsOptions {
  token?: string;
  onAlert?: (alert: WhatsAppAlert) => void;
}

interface UseWhatsAppAlertsReturn {
  alerts: WhatsAppAlert[];
  connected: boolean;
  clearAlerts: () => void;
}

export function useWhatsAppAlerts(
  options: UseWhatsAppAlertsOptions = {}
): UseWhatsAppAlertsReturn {
  const { token, onAlert } = options;
  const { socket, connected } = useSocket('/hub', { token, autoConnect: true });
  const [alerts, setAlerts] = useState<WhatsAppAlert[]>([]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;

    // Join global watchers room
    socket.emit('join:whatsapp:watchers');

    const handleAlert = (alert: WhatsAppAlert) => {
      setAlerts((prev) => [...prev.slice(-9), alert]); // Keep last 10
      onAlert?.(alert);
    };

    socket.on('whatsapp:alert', handleAlert);

    return () => {
      socket.off('whatsapp:alert', handleAlert);
      socket.emit('leave:whatsapp:watchers');
    };
  }, [socket, connected, onAlert]);

  return {
    alerts,
    connected,
    clearAlerts,
  };
}

// =============================================================================
// Status Changes Hook (for dashboard)
// =============================================================================

interface StatusChange {
  channelId: string;
  channelName: string;
  status: ChannelStatus;
  timestamp: string;
}

interface UseWhatsAppStatusChangesReturn {
  changes: StatusChange[];
  connected: boolean;
}

export function useWhatsAppStatusChanges(
  token?: string
): UseWhatsAppStatusChangesReturn {
  const { socket, connected } = useSocket('/hub', { token, autoConnect: true });
  const [changes, setChanges] = useState<StatusChange[]>([]);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit('join:whatsapp:watchers');

    const handleStatusChanged = (data: {
      channelId: string;
      channelName: string;
      status: ChannelStatus;
    }) => {
      setChanges((prev) => [
        { ...data, timestamp: new Date().toISOString() },
        ...prev.slice(0, 19), // Keep last 20
      ]);
    };

    socket.on('whatsapp:status_changed', handleStatusChanged);

    return () => {
      socket.off('whatsapp:status_changed', handleStatusChanged);
      socket.emit('leave:whatsapp:watchers');
    };
  }, [socket, connected]);

  return {
    changes,
    connected,
  };
}
