'use client';

/**
 * Diagnostic Panel Component
 *
 * Ferramentas de diagnóstico para o socket server.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Trash2, RefreshCw, Check, X } from 'lucide-react';
import type { MetricsSnapshot } from '@/lib/socket';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8001';

interface DiagnosticPanelProps {
  metrics: MetricsSnapshot | null;
  refresh: () => void;
  disconnectSocket: (socketId: string) => Promise<boolean>;
}

export function DiagnosticPanel({ metrics, refresh, disconnectSocket }: DiagnosticPanelProps) {
  const [healthResult, setHealthResult] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [socketIdInput, setSocketIdInput] = useState('');
  const [disconnectResult, setDisconnectResult] = useState<'idle' | 'success' | 'error'>('idle');

  const runHealthCheck = async () => {
    setHealthResult('loading');
    try {
      const res = await fetch(`${SOCKET_URL}/health`);
      setHealthResult(res.ok ? 'success' : 'error');
    } catch {
      setHealthResult('error');
    }
  };

  const handleDisconnect = async () => {
    if (!socketIdInput.trim()) return;
    const success = await disconnectSocket(socketIdInput.trim());
    setDisconnectResult(success ? 'success' : 'error');
    if (success) {
      setSocketIdInput('');
      setTimeout(() => setDisconnectResult('idle'), 2000);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnóstico</CardTitle>
        <CardDescription>Ferramentas para validar e gerenciar o socket server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Check */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Health Check</Label>
            <div className="flex items-center gap-2">
              {healthResult === 'success' && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  Sucesso
                </Badge>
              )}
              {healthResult === 'error' && (
                <Badge variant="outline" className="bg-critical/10 text-critical border-critical/20">
                  Falhou
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={runHealthCheck}
                disabled={healthResult === 'loading'}
              >
                {healthResult === 'loading' ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Activity className="h-4 w-4" />
                )}
                <span className="ml-2">Testar</span>
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Verifica se o servidor está respondendo em {SOCKET_URL}/health
          </p>
        </div>

        <Separator />

        {/* Refresh Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Atualizar Métricas</Label>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Força atualização das métricas (normalmente atualiza a cada 5s)
          </p>
        </div>

        <Separator />

        {/* Disconnect Socket */}
        <div className="space-y-3">
          <Label>Desconectar Socket</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Socket ID"
              value={socketIdInput}
              onChange={(e) => setSocketIdInput(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDisconnect}
              disabled={!socketIdInput.trim()}
            >
              {disconnectResult === 'success' ? (
                <Check className="h-4 w-4" />
              ) : disconnectResult === 'error' ? (
                <X className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Força desconexão de um socket específico pelo ID
          </p>
        </div>

        <Separator />

        {/* Raw Metrics */}
        <div className="space-y-3">
          <Label>Métricas Raw</Label>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48">
            {metrics ? JSON.stringify(metrics, null, 2) : 'Carregando...'}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
