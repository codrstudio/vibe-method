'use client';

/**
 * Status Badge Component
 *
 * Badge colorido para indicar status de saúde usando tokens semânticos.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Status = 'healthy' | 'degraded' | 'unhealthy' | 'connected' | 'disconnected' | 'online' | 'offline' | 'away';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  healthy: { label: 'Operacional', className: 'bg-success/10 text-success border-success/20' },
  degraded: { label: 'Degradado', className: 'bg-warning/10 text-warning border-warning/20' },
  unhealthy: { label: 'Indisponível', className: 'bg-critical/10 text-critical border-critical/20' },
  connected: { label: 'Conectado', className: 'bg-success/10 text-success border-success/20' },
  disconnected: { label: 'Desconectado', className: 'bg-critical/10 text-critical border-critical/20' },
  online: { label: 'Online', className: 'bg-success/10 text-success border-success/20' },
  offline: { label: 'Offline', className: 'bg-critical/10 text-critical border-critical/20' },
  away: { label: 'Ausente', className: 'bg-warning/10 text-warning border-warning/20' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
