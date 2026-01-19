import type { CopilotState } from '../types.js';

export function buildSystemPrompt(): string {
  return `You are a helpful AI assistant. Answer questions accurately and concisely.
If you don't know something, say so. Use the provided context to inform your answers.`;
}

export function buildQueryPrompt(state: CopilotState): string {
  const contextSection = state.retrievedDocs?.length
    ? `\n\nRelevant context:\n${state.retrievedDocs.map((d) => d.content).join('\n\n')}`
    : '';

  return `${buildSystemPrompt()}${contextSection}

User question: ${state.query}

Answer:`;
}
