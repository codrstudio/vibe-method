'use client';

/**
 * WhatsApp Connection Status Badge
 *
 * Exibe o status de conexao de um canal WhatsApp com indicador visual.
 */

import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  WifiOff,
  Loader2,
  QrCode,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChannelStatus } from '@/hooks/use-whatsapp-channel';

interface ConnectionStatusProps {
  status: ChannelStatus;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  showLabel?: boolean;
}

const statusConfig: Record<
  ChannelStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ElementType;
    className: string;
  }
> = {
  connected: {
    label: 'Conectado',
    variant: 'default',
    icon: Wifi,
    className: 'bg-green-500 hover:bg-green-600',
  },
  connecting: {
    label: 'Conectando',
    variant: 'secondary',
    icon: Loader2,
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  qr_pending: {
    label: 'Aguardando QR',
    variant: 'secondary',
    icon: QrCode,
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  degraded: {
    label: 'Degradado',
    variant: 'destructive',
    icon: AlertTriangle,
    className: 'bg-orange-500 hover:bg-orange-600',
  },
  disconnected: {
    label: 'Desconectado',
    variant: 'destructive',
    icon: WifiOff,
    className: 'bg-red-500 hover:bg-red-600',
  },
};

export function ConnectionStatus({
  status,
  retryCount,
  maxRetries,
  className,
  showLabel = true,
}: ConnectionStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const label =
    status === 'degraded' && retryCount !== undefined && maxRetries !== undefined
      ? `${config.label} (${retryCount}/${maxRetries})`
      : config.label;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, 'gap-1.5', className)}
    >
      <Icon
        className={cn('h-3 w-3', status === 'connecting' && 'animate-spin')}
      />
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}

// Variante menor para uso em tabelas/listas
export function ConnectionStatusDot({
  status,
  className,
}: {
  status: ChannelStatus;
  className?: string;
}) {
  const colors: Record<ChannelStatus, string> = {
    connected: 'bg-green-500',
    connecting: 'bg-blue-500 animate-pulse',
    qr_pending: 'bg-yellow-500',
    degraded: 'bg-orange-500 animate-pulse',
    disconnected: 'bg-red-500',
  };

  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', colors[status], className)}
      title={statusConfig[status].label}
    />
  );
}
