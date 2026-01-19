import type { AlertEvent, ChannelResult } from '../types.js';

// Store active SSE connections
const connections = new Set<(event: AlertEvent) => void>();

export function registerConnection(callback: (event: AlertEvent) => void): () => void {
  connections.add(callback);
  return () => connections.delete(callback);
}

export function getConnectionCount(): number {
  return connections.size;
}

export async function sendUiAlert(event: AlertEvent): Promise<ChannelResult> {
  try {
    // Broadcast to all SSE connections
    for (const callback of connections) {
      try {
        callback(event);
      } catch {
        // Remove failed connections
        connections.delete(callback);
      }
    }

    return {
      channel: 'ui',
      success: true,
    };
  } catch (error) {
    return {
      channel: 'ui',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
