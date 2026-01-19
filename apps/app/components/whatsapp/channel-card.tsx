'use client';

/**
 * WhatsApp Channel Card
 *
 * Card que exibe informacoes de um numero WhatsApp registrado.
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <Card className={cn('group relative', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ConnectionStatusDot status={status} />
              <CardTitle className="text-base">{name}</CardTitle>
            </div>
            {description && (
              <CardDescription className="text-sm line-clamp-2">
                {description}
              </CardDescription>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Acoes</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status !== 'connected' && onRefreshQr && (
                <DropdownMenuItem onClick={onRefreshQr} disabled={isLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Gerar novo QR
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href={`/settings/whatsapp/channels/${id}`}>
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
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status & Phone */}
        <div className="flex items-center justify-between">
          <ConnectionStatus status={status} />
          {phoneNumber && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              {phoneNumber}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            {assignmentsCount} {assignmentsCount === 1 ? 'atribuicao' : 'atribuicoes'}
          </span>
        </div>

        {/* Action Link */}
        <Link href={`/settings/whatsapp/channels/${id}`} className="block">
          <Button variant="outline" className="w-full justify-between" size="sm">
            {status === 'connected' ? 'Gerenciar' : 'Conectar'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Variante compacta para listas
export function ChannelCardCompact({
  id,
  name,
  status,
  phoneNumber,
  className,
}: Pick<ChannelCardProps, 'id' | 'name' | 'status' | 'phoneNumber' | 'className'>) {
  return (
    <Link href={`/settings/whatsapp/channels/${id}`}>
      <Card className={cn('cursor-pointer transition-colors hover:bg-muted/50', className)}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ConnectionStatusDot status={status} />
            <div>
              <p className="font-medium">{name}</p>
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
