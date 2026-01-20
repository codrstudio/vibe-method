'use client';

/**
 * WhatsApp Simulator Connection Panel
 *
 * Painel para conectar e gerenciar canais no simulador WhatsApp.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConnectionStatus } from './connection-status';
import {
  FlaskConical,
  ExternalLink,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import type { ChannelStatus } from '@/hooks/use-whatsapp-channel';

interface SimulatorConnectionPanelProps {
  channelId: string;
  instanceName: string;
  status: ChannelStatus;
  phoneNumber?: string | null;
  onStatusChange?: () => void;
}

const WA_SIM_URL = process.env.NEXT_PUBLIC_WA_SIM_URL || 'http://localhost:8003';
const WA_SIM_UI_URL = process.env.NEXT_PUBLIC_WA_SIM_UI_URL || 'http://localhost:8004';

export function SimulatorConnectionPanel({
  channelId,
  instanceName,
  status,
  phoneNumber,
  onStatusChange,
}: SimulatorConnectionPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = status === 'connected';

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const res = await fetch(`${WA_SIM_URL}/instances/${instanceName}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: '5511999999999' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao conectar');
      }
      onStatusChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);
    try {
      const res = await fetch(`${WA_SIM_URL}/instances/${instanceName}/disconnect`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao desconectar');
      }
      onStatusChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const openSimulatorUI = () => {
    window.open(`${WA_SIM_UI_URL}?instance=${instanceName}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-500" />
            <CardTitle>Simulador WhatsApp</CardTitle>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            Ambiente de Teste
          </Badge>
        </div>
        <CardDescription>
          Gerencie a conexão do simulador para testar fluxos de mensagens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Status da Instância</p>
            <p className="text-sm text-muted-foreground">
              Instância: <code className="rounded bg-muted px-1">{instanceName}</code>
            </p>
            {phoneNumber && (
              <p className="text-sm text-muted-foreground">
                Número simulado: {phoneNumber}
              </p>
            )}
          </div>
          <ConnectionStatus status={status} />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {isConnected ? (
            <>
              <Button
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex-1"
              >
                {isDisconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <WifiOff className="mr-2 h-4 w-4" />
                )}
                Desconectar
              </Button>
              <Button onClick={openSimulatorUI} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Simulador
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="mr-2 h-4 w-4" />
                )}
                Conectar Simulador
              </Button>
              <Button variant="outline" onClick={openSimulatorUI} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Interface
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-sm font-medium mb-2">Como usar o simulador:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Clique em &quot;Conectar Simulador&quot; para ativar a instância</li>
            <li>Abra a interface do simulador clicando em &quot;Abrir Simulador&quot;</li>
            <li>Na interface, envie mensagens como se fosse um usuário real</li>
            <li>As mensagens serão processadas pelo sistema normalmente</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
