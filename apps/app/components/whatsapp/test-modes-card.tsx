'use client';

/**
 * Test Modes Card
 *
 * Card que exibe e permite configurar os modos de teste do canal WhatsApp:
 * - Echo: Mensagem recebida retorna ao remetente
 * - Echo-To: Mensagem recebida vai para número específico
 * - Redirect: Mensagem enviada vai para número específico
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { FlaskConical, ArrowLeft, ArrowRight, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestModesCardProps {
  channelId: string;
  echoEnabled: boolean;
  echoToNumber: string | null;
  redirectToNumber: string | null;
  onUpdate: (updates: {
    echoEnabled?: boolean;
    echoToNumber?: string | null;
    redirectToNumber?: string | null;
  }) => Promise<void>;
  className?: string;
}

export function TestModesCard({
  channelId,
  echoEnabled: initialEchoEnabled,
  echoToNumber: initialEchoToNumber,
  redirectToNumber: initialRedirectToNumber,
  onUpdate,
  className,
}: TestModesCardProps) {
  const [echoEnabled, setEchoEnabled] = useState(initialEchoEnabled);
  const [echoToNumber, setEchoToNumber] = useState(initialEchoToNumber || '');
  const [redirectToNumber, setRedirectToNumber] = useState(initialRedirectToNumber || '');

  const [savingEcho, setSavingEcho] = useState(false);
  const [savingEchoTo, setSavingEchoTo] = useState(false);
  const [savingRedirect, setSavingRedirect] = useState(false);

  // Determine active mode
  const activeMode = initialEchoToNumber
    ? 'echo-to'
    : initialEchoEnabled
    ? 'echo'
    : initialRedirectToNumber
    ? 'redirect'
    : null;

  const handleEchoToggle = async (checked: boolean) => {
    setSavingEcho(true);
    try {
      await onUpdate({ echoEnabled: checked });
      setEchoEnabled(checked);
    } finally {
      setSavingEcho(false);
    }
  };

  const handleSaveEchoTo = async () => {
    setSavingEchoTo(true);
    try {
      await onUpdate({ echoToNumber: echoToNumber || null });
    } finally {
      setSavingEchoTo(false);
    }
  };

  const handleClearEchoTo = async () => {
    setSavingEchoTo(true);
    try {
      await onUpdate({ echoToNumber: null });
      setEchoToNumber('');
    } finally {
      setSavingEchoTo(false);
    }
  };

  const handleSaveRedirect = async () => {
    setSavingRedirect(true);
    try {
      await onUpdate({ redirectToNumber: redirectToNumber || null });
    } finally {
      setSavingRedirect(false);
    }
  };

  const handleClearRedirect = async () => {
    setSavingRedirect(true);
    try {
      await onUpdate({ redirectToNumber: null });
      setRedirectToNumber('');
    } finally {
      setSavingRedirect(false);
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Modos de Teste</CardTitle>
          </div>
          {activeMode && (
            <Badge variant={activeMode === 'redirect' ? 'destructive' : 'secondary'}>
              {activeMode === 'echo' && 'Espelho Ativo'}
              {activeMode === 'echo-to' && 'Espelhar Para Ativo'}
              {activeMode === 'redirect' && 'Redirecionamento Ativo'}
            </Badge>
          )}
        </div>
        <CardDescription>
          Configure modos de teste para debug e desenvolvimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Echo Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="echo-mode" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Modo Espelho
              </Label>
              <p className="text-sm text-muted-foreground">
                Mensagem recebida retorna ao remetente
              </p>
            </div>
            <div className="flex items-center gap-2">
              {savingEcho && <Loader2 className="h-4 w-4 animate-spin" />}
              <Switch
                id="echo-mode"
                checked={echoEnabled}
                onCheckedChange={handleEchoToggle}
                disabled={savingEcho || !!initialEchoToNumber}
              />
            </div>
          </div>
          {initialEchoToNumber && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Desativado porque Espelhar Para está configurado
            </p>
          )}
        </div>

        <Separator />

        {/* Echo-To Mode */}
        <div className="space-y-2">
          <div className="space-y-0.5">
            <Label htmlFor="echo-to-number" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <ArrowRight className="h-4 w-4 -ml-2" />
              Modo Espelhar Para
            </Label>
            <p className="text-sm text-muted-foreground">
              Mensagem recebida vai para número específico
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="echo-to-number"
              placeholder="5511999999999"
              value={echoToNumber}
              onChange={(e) => setEchoToNumber(e.target.value)}
              className="flex-1"
            />
            {initialEchoToNumber ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearEchoTo}
                disabled={savingEchoTo}
              >
                {savingEchoTo ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleSaveEchoTo}
                disabled={savingEchoTo || !echoToNumber}
              >
                {savingEchoTo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Redirect Mode */}
        <div className="space-y-2">
          <div className="space-y-0.5">
            <Label htmlFor="redirect-number" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Modo Redirecionar
            </Label>
            <p className="text-sm text-muted-foreground">
              Mensagem enviada vai para número específico
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="redirect-number"
              placeholder="5511999999999"
              value={redirectToNumber}
              onChange={(e) => setRedirectToNumber(e.target.value)}
              className="flex-1"
            />
            {initialRedirectToNumber ? (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearRedirect}
                disabled={savingRedirect}
              >
                {savingRedirect ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleSaveRedirect}
                disabled={savingRedirect || !redirectToNumber}
              >
                {savingRedirect ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
