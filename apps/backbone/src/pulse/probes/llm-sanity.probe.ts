import { invokeSanity } from '../../agents/index.js';
import { llmService } from '../../llm/index.js';
import type { HealthProbe, ProbeResult, LLMSanityDetails } from '../types.js';

export const llmSanityShallowProbe: HealthProbe = {
  name: 'llm-sanity',
  isDeep: false,
  async check(): Promise<ProbeResult> {
    const start = performance.now();

    try {
      const intents = await llmService.getIntentsWithBindings();
      const configured = intents.filter((i) => i.binding).length;

      return {
        name: 'llm-sanity',
        healthy: configured > 0,
        latency: performance.now() - start,
        message: configured === 0 ? 'No intent bindings configured' : undefined,
        details: {
          bindings: {
            configured,
            intents: intents.map((i) => i.slug),
          },
        } as LLMSanityDetails,
      };
    } catch (error) {
      return {
        name: 'llm-sanity',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const llmSanityDeepProbe: HealthProbe = {
  name: 'llm-sanity',
  isDeep: true,
  async check(): Promise<ProbeResult> {
    const start = performance.now();

    try {
      // Run sanity check with classify intent (smallest model)
      const result = await invokeSanity({ intent: 'classify' });

      // Get bindings info
      const intents = await llmService.getIntentsWithBindings();
      const configured = intents.filter((i) => i.binding).length;

      const latency = performance.now() - start;

      return {
        name: 'llm-sanity',
        healthy: result.success,
        latency,
        message: result.error,
        details: {
          inference: {
            success: result.success,
            response: result.response,
            model: result.model,
            provider: result.provider,
            latencyMs: result.latencyMs,
            error: result.error,
          },
          bindings: {
            configured,
            intents: intents.map((i) => i.slug),
          },
        } as LLMSanityDetails,
      };
    } catch (error) {
      return {
        name: 'llm-sanity',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
