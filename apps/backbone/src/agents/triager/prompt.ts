import type { TriagerState } from '../types.js';

export function buildClassifyPrompt(state: TriagerState): string {
  const lastMessage = state.messages[state.messages.length - 1];

  return `You are a message triager. Analyze the following message and classify it.

Message:
${lastMessage?.content ?? ''}

Respond with a JSON object containing:
- intent: The primary intent of the message (e.g., "question", "request", "complaint", "feedback")
- urgency: One of "low", "medium", "high", "critical"
- confidence: A number between 0 and 1 indicating your confidence

JSON response:`;
}

export function buildPlanPrompt(state: TriagerState): string {
  return `Based on the classification:
Intent: ${state.classification?.intent}
Urgency: ${state.classification?.urgency}

Determine what actions should be taken. Available actions:
- thread.create: Create a new thread
- notification.create: Send a notification
- kb.search: Search knowledge base

Respond with a JSON array of actions to take:
[{"name": "action.name", "params": {...}}]

JSON response:`;
}
