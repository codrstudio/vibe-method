import { config } from '../../config.js';
import type { HealthProbe, ProbeResult } from '../types.js';

export const llmShallowProbe: HealthProbe = {
  name: 'llm',
  isDeep: false,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    const hasApiKey = !!config.OPENROUTER_API_KEY;

    return {
      name: 'llm',
      healthy: hasApiKey,
      latency: performance.now() - start,
      message: hasApiKey ? undefined : 'OPENROUTER_API_KEY not configured',
      details: {
        baseUrl: config.OPENROUTER_BASE_URL,
        configured: hasApiKey,
      },
    };
  },
};

export const llmDeepProbe: HealthProbe = {
  name: 'llm',
  isDeep: true,
  async check(): Promise<ProbeResult> {
    const start = performance.now();

    if (!config.OPENROUTER_API_KEY) {
      return {
        name: 'llm',
        healthy: false,
        latency: performance.now() - start,
        message: 'OPENROUTER_API_KEY not configured',
      };
    }

    try {
      const response = await fetch(`${config.OPENROUTER_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${config.OPENROUTER_API_KEY}` },
      });

      const latency = performance.now() - start;

      return {
        name: 'llm',
        healthy: response.ok,
        latency,
        message: response.ok ? undefined : `HTTP ${response.status}`,
        details: { statusCode: response.status },
      };
    } catch (error) {
      return {
        name: 'llm',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
