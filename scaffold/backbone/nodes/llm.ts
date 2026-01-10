/**
 * LLM NODE - Chamadas ao OpenRouter
 *
 * Funcoes para chamar o LLM diretamente (sem agente).
 * Use para classificacao, geracao de texto, etc.
 */

import { config } from '../config.js';
import type { ChatMessage, LLMResult } from '../types.js';

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// =============================================================================
// CORE API
// =============================================================================

/**
 * Chama a API do OpenRouter com array de mensagens
 */
async function callOpenRouter(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' } | { type: 'text' };
  } = {}
): Promise<LLMResult> {
  const {
    model = config.OPENROUTER_DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 1024,
    responseFormat,
  } = options;

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const response = await fetch(`${config.OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Backbone',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as OpenRouterResponse;
  const content = data.choices[0]?.message?.content || '';

  return {
    content,
    model: data.model,
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Constroi array de mensagens a partir do historico
 */
export function buildConversationMessages(
  systemPrompt: string,
  history: Array<{ direction: 'in' | 'out'; content: string }>,
  currentMessage?: string
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  // Adicionar historico como mensagens alternadas user/assistant
  for (const msg of history) {
    messages.push({
      role: msg.direction === 'in' ? 'user' : 'assistant',
      content: msg.content,
    });
  }

  // Adicionar mensagem atual se fornecida
  if (currentMessage) {
    messages.push({ role: 'user', content: currentMessage });
  }

  return messages;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Gera uma resposta de texto simples
 */
export async function generateText(
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResult> {
  return callOpenRouter(
    [{ role: 'user', content: prompt }],
    options
  );
}

/**
 * Gera uma resposta com system prompt e historico
 */
export async function generateResponse(
  systemPrompt: string,
  history: Array<{ direction: 'in' | 'out'; content: string }>,
  currentMessage: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<LLMResult> {
  const messages = buildConversationMessages(systemPrompt, history, currentMessage);
  return callOpenRouter(messages, options);
}

/**
 * Classifica uma mensagem e retorna JSON
 *
 * @example
 * const result = await classifyMessage(
 *   'Qual o horario de funcionamento?',
 *   'Classifique a intencao: faq, agendamento, reclamacao, outro. Retorne JSON: { "intent": "...", "confidence": 0.0-1.0 }'
 * );
 */
export async function classifyMessage(
  message: string,
  classificationPrompt: string,
  options?: {
    model?: string;
  }
): Promise<{ content: string; parsed?: unknown; usage?: LLMResult['usage'] }> {
  const result = await callOpenRouter(
    [
      { role: 'system', content: classificationPrompt },
      { role: 'user', content: message },
    ],
    {
      ...options,
      temperature: 0.3, // Baixa temperatura para classificacao
      responseFormat: { type: 'json_object' },
    }
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    // Nao conseguiu parsear como JSON
  }

  return {
    content: result.content,
    parsed,
    usage: result.usage,
  };
}

/**
 * Retry com backoff exponencial para chamadas LLM
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, backoff = 1000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      console.error(`LLM attempt ${attempt} failed, retrying in ${backoff * attempt}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff * attempt));
    }
  }

  throw new Error('Unreachable');
}
