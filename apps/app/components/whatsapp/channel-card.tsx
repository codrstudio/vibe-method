'use client';

/**
 * WhatsApp Channel Card
 *
 * Card que exibe informacoes de um numero WhatsApp registrado.
 * Updated: 2026-01-20 - Redesigned with cleaner hierarchy
 */

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectionStatus, ConnectionStatusDot } from './connection-status';
import {
  Phone,
  ChevronRight,
  Calendar,
  Link as LinkIcon,
  MoreVertical,
  Trash2,
  RefreshCw,
  FlaskConical,
  Smartphone,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ChannelStatus } from '@/hooks/use-whatsapp-channel';

interface ChannelCardProps {
  id: string;
  name: string;
  description?: string | null;
  status: ChannelStatus;
  phoneNumber?: string | null;
  assignmentsCount?: number;
  createdAt: string;
  provider?: 'evolution' | 'simulator';
  onRefreshQr?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ChannelCard({
  id,
  name,
  description,
  status,
  phoneNumber,
  assignmentsCount = 0,
  createdAt,
  provider = 'evolution',
  onRefreshQr,
  onDelete,
  isLoading = false,
  className,
}: ChannelCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const isSimulator = provider === 'simulator';

  return (
    <Card className={cn('group relative', className)}>
      {/* Header: Nome + Provider Badge + Menu */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ConnectionStatusDot status={status} className="shrink-0" />
            <CardTitle className="text-base truncate">{name}</CardTitle>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isSimulator ? (
              <Badge variant="secondary" className="text-xs gap-1 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <FlaskConical className="h-3 w-3" />
                <span className="hidden sm:inline">Simulador</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Smartphone className="h-3 w-3" />
                <span className="hidden sm:inline">Evolution</span>
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Acoes</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isSimulator && status !== 'connected' && onRefreshQr && (
                  <DropdownMenuItem onClick={onRefreshQr} disabled={isLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gerar novo QR
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/app/settings/whatsapp/channels/${id}`}>
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </Link>
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      disabled={isLoading}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      {/* Content: Phone + Metadata */}
      <CardContent className="pb-3 space-y-2">
        {/* Phone number (highlighted) */}
        {phoneNumber && (
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {phoneNumber}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            {assignmentsCount} {assignmentsCount === 1 ? 'atribuicao' : 'atribuicoes'}
          </span>
        </div>
      </CardContent>

      {/* Footer: Status Badge + Action Button */}
      <CardFooter className="pt-0 flex items-center justify-between gap-2">
        <ConnectionStatus status={status} className="text-xs" />
        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" asChild>
          <Link href={`/app/settings/whatsapp/channels/${id}`}>
            {status === 'connected' ? 'Gerenciar' : 'Conectar'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Variante compacta para listas
export function ChannelCardCompact({
  id,
  name,
  status,
  phoneNumber,
  provider = 'evolution',
  className,
}: Pick<ChannelCardProps, 'id' | 'name' | 'status' | 'phoneNumber' | 'provider' | 'className'>) {
  const isSimulator = provider === 'simulator';

  return (
    <Link href={`/app/settings/whatsapp/channels/${id}`}>
      <Card className={cn('cursor-pointer transition-colors hover:bg-muted/50', className)}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ConnectionStatusDot status={status} />
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{name}</p>
                {isSimulator ? (
                  <FlaskConical className="h-3 w-3 text-purple-500" />
                ) : (
                  <Smartphone className="h-3 w-3 text-green-500" />
                )}
              </div>
              {phoneNumber && (
                <p className="text-sm text-muted-foreground">{phoneNumber}</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
