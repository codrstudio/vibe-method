'use client';

/**
 * WhatsApp QR Code Viewer
 *
 * Exibe QR code para conexao com countdown de expiracao.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrCodeViewerProps {
  qrCode: string | null;
  expiresAt: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function QrCodeViewer({
  qrCode,
  expiresAt,
  onRefresh,
  isRefreshing = false,
  className,
}: QrCodeViewerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      setIsExpired(false);
      return;
    }

    const updateTimeLeft = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));

      setTimeLeft(diff);
      setIsExpired(diff === 0);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Smartphone className="h-5 w-5" />
          Conectar WhatsApp
        </CardTitle>
        <CardDescription>
          Escaneie o QR code com seu celular
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {/* QR Code Display */}
        <div
          className={cn(
            'relative flex items-center justify-center rounded-lg border-2 bg-white p-4',
            isExpired ? 'border-red-300' : 'border-gray-200'
          )}
        >
          {qrCode ? (
            <>
              <img
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="WhatsApp QR Code"
                className={cn(
                  'h-48 w-48',
                  isExpired && 'opacity-30 blur-sm'
                )}
              />
              {isExpired && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Gerar novo QR
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-48 w-48 items-center justify-center text-muted-foreground">
              <div className="text-center">
                <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin" />
                <p className="text-sm">Gerando QR code...</p>
              </div>
            </div>
          )}
        </div>

        {/* Timer */}
        {timeLeft !== null && !isExpired && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Expira em {formatTime(timeLeft)}</span>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground">
          <ol className="list-inside list-decimal space-y-1 text-left">
            <li>Abra o WhatsApp no seu celular</li>
            <li>
              Toque em <strong>Menu</strong> ou <strong>Configuracoes</strong>
            </li>
            <li>
              Selecione <strong>Aparelhos conectados</strong>
            </li>
            <li>
              Toque em <strong>Conectar aparelho</strong>
            </li>
            <li>Aponte a camera para este QR code</li>
          </ol>
        </div>

        {/* Refresh Button (when not expired) */}
        {!isExpired && onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar QR
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
