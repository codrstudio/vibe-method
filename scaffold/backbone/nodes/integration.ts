/**
 * INTEGRATION NODE - Exemplo de Integracao Externa
 *
 * Template para integracoes com APIs externas.
 *
 * CUSTOMIZE:
 * - Renomeie para o nome do seu servico (ex: whatsapp.ts, slack.ts)
 * - Implemente as funcoes de integracao
 * - Adicione tratamento de erros especifico
 */

import { config } from '../config.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Exemplo: configuracao de uma API externa
// const EXTERNAL_API_URL = config.EXTERNAL_API_URL;
// const EXTERNAL_API_KEY = config.EXTERNAL_API_KEY;

// =============================================================================
// TYPES
// =============================================================================

export interface SendMessageParams {
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// API CALLS
// =============================================================================

/**
 * Exemplo: Envia mensagem para servico externo
 *
 * @param params - Parametros da mensagem
 * @returns Resultado do envio
 */
export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  try {
    // Exemplo de chamada a API externa
    // const response = await fetch(`${EXTERNAL_API_URL}/messages`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${EXTERNAL_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     to: params.to,
    //     text: params.message,
    //     ...params.metadata,
    //   }),
    // });
    //
    // if (!response.ok) {
    //   throw new Error(`API error: ${response.status}`);
    // }
    //
    // const data = await response.json();
    // return { success: true, messageId: data.id };

    // Placeholder - substitua pela implementacao real
    console.log('[Integration] Sending message:', params);

    return {
      success: true,
      messageId: crypto.randomUUID(),
    };
  } catch (error) {
    console.error('[Integration] Failed to send message:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Exemplo: Verifica status de conexao com servico externo
 */
export async function checkConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    // Exemplo de health check
    // const response = await fetch(`${EXTERNAL_API_URL}/health`);
    // if (!response.ok) throw new Error('Health check failed');

    // Placeholder
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Exemplo: Busca informacoes de um recurso externo
 */
export async function getResource(id: string): Promise<{
  found: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  try {
    // Exemplo de busca
    // const response = await fetch(`${EXTERNAL_API_URL}/resources/${id}`);
    // if (response.status === 404) return { found: false };
    // if (!response.ok) throw new Error(`API error: ${response.status}`);
    // const data = await response.json();
    // return { found: true, data };

    // Placeholder
    return {
      found: true,
      data: { id, name: 'Example Resource' },
    };
  } catch (error) {
    return {
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Formata numero de telefone para formato internacional
 */
export function formatPhoneNumber(phone: string): string {
  // Remove tudo que nao e digito
  const digits = phone.replace(/\D/g, '');

  // Se nao tem codigo de pais, assume Brasil (+55)
  if (digits.length <= 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Valida se o numero de telefone e valido
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
