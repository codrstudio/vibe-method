import { z } from 'zod';

/**
 * Base state for all agents
 */
export interface BaseAgentState {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  context: AgentContext;
  error?: string;
}

/**
 * Context passed to every agent invocation
 */
export interface AgentContext {
  userId: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Agent invocation result
 */
export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Triager-specific state
 */
export interface TriagerState extends BaseAgentState {
  classification?: {
    intent: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  };
  plannedActions?: Array<{
    name: string;
    params: Record<string, unknown>;
  }>;
}

/**
 * Copilot-specific state
 */
export interface CopilotState extends BaseAgentState {
  query: string;
  retrievedDocs?: Array<{
    id: string;
    content: string;
    score: number;
  }>;
  response?: string;
}

/**
 * Input schemas for agent invocation
 */
export const TriagerInputSchema = z.object({
  body: z.string(),
  authorType: z.enum(['user', 'external', 'system']),
  metadata: z.record(z.unknown()).optional(),
});

export type TriagerInput = z.infer<typeof TriagerInputSchema>;

export const CopilotInputSchema = z.object({
  query: z.string().min(1),
  conversationId: z.string().optional(),
  context: z.record(z.unknown()).optional(),
});

export type CopilotInput = z.infer<typeof CopilotInputSchema>;
