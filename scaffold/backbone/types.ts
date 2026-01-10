/**
 * TYPES - TypeScript Definitions
 *
 * Tipos genericos reutilizaveis no backbone.
 * Adicione tipos especificos do seu projeto conforme necessario.
 */

import { z } from 'zod';

// =============================================================================
// MESSAGE TYPES
// =============================================================================

/**
 * Estado da mensagem no workflow
 */
export interface MessageState {
  phone: string;
  name: string;
  message: string;
  timestamp: string;
}

/**
 * Mensagem do historico
 */
export interface HistoryMessage {
  direction: 'in' | 'out';
  content: string;
  created_at?: string;
}

// =============================================================================
// AGENT TYPES
// =============================================================================

/**
 * Input para o agente
 */
export interface AgentInput {
  message: string;
  userId?: string;
  userName?: string;
  currentDatetime: string;
  contextSummary?: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Output do agente
 */
export interface AgentOutput {
  response: string;
  toolsUsed: string[];
  iterationCount: number;
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/**
 * Contexto da conversa carregado do banco
 * Customize conforme seu dominio
 */
export interface ConversationContext {
  conversationId: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    // Adicione campos especificos do seu dominio
  };
  currentDatetime: string;
  lastMessages?: HistoryMessage[];
  // Adicione campos de contexto especificos
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

/**
 * Schema de validacao para webhook de mensagem
 * Customize conforme seu gateway (WhatsApp, Telegram, etc)
 */
export const WebhookMessageSchema = z.object({
  phone: z.string().min(1),
  name: z.string().default('Usuario'),
  message: z.string().min(1),
  timestamp: z.string().optional().default(() => new Date().toISOString()),
});

export type WebhookMessage = z.infer<typeof WebhookMessageSchema>;

// =============================================================================
// LLM TYPES
// =============================================================================

/**
 * Resultado de chamada ao LLM
 */
export interface LLMResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Mensagem para o LLM
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// =============================================================================
// EXECUTION TYPES
// =============================================================================

/**
 * Status de execucao de workflow
 */
export type ExecutionStatus = 'running' | 'success' | 'failed';

/**
 * Step de execucao
 */
export interface ExecutionStep {
  name: string;
  status: 'success' | 'failed';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  timestamp: string;
}

/**
 * Registro de execucao completo
 */
export interface ExecutionRecord {
  id: string;
  workflow: string;
  trigger: string;
  status: ExecutionStatus;
  steps: ExecutionStep[];
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
}
