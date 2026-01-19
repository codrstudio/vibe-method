'use client';

/**
 * WhatsApp Test Message Form
 *
 * Formulario para enviar mensagem de teste atraves de um canal.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestMessageFormProps {
  channelId: string;
  channelName: string;
  onSend: (to: string, text: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  className?: string;
}

export function TestMessageForm({
  channelId,
  channelName,
  onSend,
  className,
}: TestMessageFormProps) {
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    messageId?: string;
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!to.trim() || !text.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await onSend(to.trim(), text.trim());
      setResult(response);

      if (response.success) {
        setText('');
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Enviar Mensagem de Teste
        </CardTitle>
        <CardDescription>
          Envie uma mensagem atraves de {channelName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="to">Numero de destino</Label>
            <Input
              id="to"
              type="tel"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="5511999999999"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Inclua codigo do pais (55 para Brasil)
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="text">Mensagem</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite sua mensagem de teste..."
              rows={4}
              disabled={isLoading}
              maxLength={4096}
            />
            <p className="text-xs text-muted-foreground text-right">
              {text.length}/4096
            </p>
          </div>

          {/* Result */}
          {result && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg p-3',
                result.success
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              )}
            >
              {result.success ? (
                <>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Mensagem enviada!</p>
                    {result.messageId && (
                      <p className="text-xs opacity-80">ID: {result.messageId}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Erro ao enviar</p>
                    <p className="text-sm opacity-80">{result.error}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading || !to.trim() || !text.trim()}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Mensagem
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
