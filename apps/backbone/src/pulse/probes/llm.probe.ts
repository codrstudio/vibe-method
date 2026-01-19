import { config } from '../../config.js';
import type { HealthProbe, ProbeResult, OpenRouterDetails } from '../types.js';

interface OpenRouterKeyResponse {
  data: {
    label?: string;
    usage: number;
    limit: number | null;
    is_free_tier: boolean;
    rate_limit: {
      requests: number;
      interval: string;
    };
  };
}

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
        defaultModel: config.OPENROUTER_DEFAULT_MODEL,
        configured: hasApiKey,
      } as OpenRouterDetails,
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
      // Fetch both /models (connectivity check) and /auth/key (credits/usage)
      const [modelsRes, keyRes] = await Promise.all([
        fetch(`${config.OPENROUTER_BASE_URL}/models`, {
          headers: { Authorization: `Bearer ${config.OPENROUTER_API_KEY}` },
          signal: AbortSignal.timeout(10000),
        }),
        fetch(`${config.OPENROUTER_BASE_URL}/auth/key`, {
          headers: { Authorization: `Bearer ${config.OPENROUTER_API_KEY}` },
          signal: AbortSignal.timeout(10000),
        }),
      ]);

      const latency = performance.now() - start;

      if (!modelsRes.ok) {
        return {
          name: 'llm',
          healthy: false,
          latency,
          message: `Models API returned HTTP ${modelsRes.status}`,
          details: {
            baseUrl: config.OPENROUTER_BASE_URL,
            defaultModel: config.OPENROUTER_DEFAULT_MODEL,
            configured: true,
          } as OpenRouterDetails,
        };
      }

      let keyData: OpenRouterKeyResponse | null = null;
      if (keyRes.ok) {
        keyData = (await keyRes.json()) as OpenRouterKeyResponse;
      }

      const details: OpenRouterDetails = {
        baseUrl: config.OPENROUTER_BASE_URL,
        defaultModel: config.OPENROUTER_DEFAULT_MODEL,
        configured: true,
      };

      if (keyData?.data) {
        const { usage, limit, is_free_tier, rate_limit } = keyData.data;

        details.credits = {
          remaining: limit !== null ? limit - usage : Infinity,
          limit,
          percentUsed: limit !== null ? (usage / limit) * 100 : null,
        };
        details.usage = { total: usage };
        details.isFreeTier = is_free_tier;
        details.rateLimit = rate_limit;
      }

      return {
        name: 'llm',
        healthy: true,
        latency,
        details,
      };
    } catch (error) {
      return {
        name: 'llm',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          baseUrl: config.OPENROUTER_BASE_URL,
          defaultModel: config.OPENROUTER_DEFAULT_MODEL,
          configured: true,
        } as OpenRouterDetails,
      };
    }
  },
};
