import { config } from '../../config.js';
import type {
  HealthProbe,
  ProbeResult,
  OllamaDetails,
  OllamaModel,
  OllamaLoadedModel,
} from '../types.js';

interface OllamaVersionResponse {
  version: string;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

interface OllamaPsResponse {
  models: OllamaLoadedModel[];
}

export const ollamaShallowProbe: HealthProbe = {
  name: 'ollama',
  isDeep: false,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    const isAvailable = config.OLLAMA_AVAILABLE;
    const hasUrl = !!config.OLLAMA_URL;

    const healthy = isAvailable && hasUrl;

    return {
      name: 'ollama',
      healthy,
      latency: performance.now() - start,
      message: !healthy
        ? !isAvailable
          ? 'OLLAMA_AVAILABLE=false'
          : 'OLLAMA_URL not configured'
        : undefined,
      details: {
        available: isAvailable,
        url: config.OLLAMA_URL ?? '',
      } as OllamaDetails,
    };
  },
};

export const ollamaDeepProbe: HealthProbe = {
  name: 'ollama',
  isDeep: true,
  async check(): Promise<ProbeResult> {
    const start = performance.now();

    if (!config.OLLAMA_AVAILABLE) {
      return {
        name: 'ollama',
        healthy: true, // Not a failure if disabled
        latency: performance.now() - start,
        message: 'Ollama disabled (OLLAMA_AVAILABLE=false)',
        details: {
          available: false,
          url: config.OLLAMA_URL ?? '',
        } as OllamaDetails,
      };
    }

    if (!config.OLLAMA_URL) {
      return {
        name: 'ollama',
        healthy: false,
        latency: performance.now() - start,
        message: 'OLLAMA_URL not configured',
      };
    }

    try {
      const [versionRes, tagsRes, psRes] = await Promise.all([
        fetch(`${config.OLLAMA_URL}/api/version`, {
          signal: AbortSignal.timeout(5000),
        }),
        fetch(`${config.OLLAMA_URL}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        }),
        fetch(`${config.OLLAMA_URL}/api/ps`, {
          signal: AbortSignal.timeout(5000),
        }),
      ]);

      const latency = performance.now() - start;

      if (!versionRes.ok) {
        return {
          name: 'ollama',
          healthy: false,
          latency,
          message: `Version check failed: HTTP ${versionRes.status}`,
        };
      }

      const versionData = (await versionRes.json()) as OllamaVersionResponse;
      const tagsData = tagsRes.ok
        ? ((await tagsRes.json()) as OllamaTagsResponse)
        : { models: [] };
      const psData = psRes.ok
        ? ((await psRes.json()) as OllamaPsResponse)
        : { models: [] };

      return {
        name: 'ollama',
        healthy: true,
        latency,
        details: {
          available: true,
          url: config.OLLAMA_URL,
          version: versionData.version,
          modelsInstalled: tagsData.models.length,
          modelsLoaded: psData.models.length,
          models: tagsData.models,
          loaded: psData.models,
          config: {
            maxParams: config.OLLAMA_MAX_PARAMS,
            allowedQuants: config.OLLAMA_ALLOWED_QUANTS,
          },
        } as OllamaDetails,
      };
    } catch (error) {
      return {
        name: 'ollama',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          available: false,
          url: config.OLLAMA_URL ?? '',
        } as OllamaDetails,
      };
    }
  },
};
