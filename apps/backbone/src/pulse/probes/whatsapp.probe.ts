import { config } from '../../config.js';
import { channelsRepository } from '../../services/whatsapp/repository.js';
import { evolutionClient } from '../../services/whatsapp/evolution-client.js';
import type { HealthProbe, ProbeResult } from '../types.js';

/**
 * Shallow probe: Check if Evolution API is configured
 */
export const whatsappShallowProbe: HealthProbe = {
  name: 'whatsapp',
  isDeep: false,
  async check(): Promise<ProbeResult> {
    const start = performance.now();

    try {
      const hasEvolutionUrl = !!config.EVOLUTION_API_URL;
      const hasEvolutionKey = !!config.EVOLUTION_API_KEY;
      const hasConfig = hasEvolutionUrl && hasEvolutionKey;

      return {
        name: 'whatsapp',
        healthy: hasConfig,
        latency: performance.now() - start,
        message: hasConfig
          ? 'Evolution API configured'
          : 'Evolution API not configured',
        details: {
          evolutionUrl: hasEvolutionUrl ? 'configured' : 'missing',
          apiKey: hasEvolutionKey ? 'configured' : 'missing',
        },
      };
    } catch (error) {
      return {
        name: 'whatsapp',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

/**
 * Deep probe: Check Evolution API connection and channel statuses
 */
export const whatsappDeepProbe: HealthProbe = {
  name: 'whatsapp',
  isDeep: true,
  async check(): Promise<ProbeResult> {
    const start = performance.now();

    try {
      // Check if Evolution API is configured
      if (!config.EVOLUTION_API_URL || !config.EVOLUTION_API_KEY) {
        return {
          name: 'whatsapp',
          healthy: false,
          latency: performance.now() - start,
          message: 'Evolution API not configured',
        };
      }

      // 1. Check Evolution API health
      const evolutionHealthy = await evolutionClient.healthCheck();
      if (!evolutionHealthy) {
        return {
          name: 'whatsapp',
          healthy: false,
          latency: performance.now() - start,
          message: 'Evolution API unreachable',
        };
      }

      // 2. Get channels and analyze status
      const channels = await channelsRepository.findAll();
      const byStatus: Record<string, number> = {};

      for (const channel of channels) {
        byStatus[channel.status] = (byStatus[channel.status] || 0) + 1;
      }

      // 3. Determine overall health
      const hasDisconnected = (byStatus['disconnected'] || 0) > 0;
      const hasDegraded = (byStatus['degraded'] || 0) > 0;
      const connectedCount = byStatus['connected'] || 0;
      const totalCount = channels.length;

      // Healthy if all connected or no channels
      // Degraded if some disconnected/degraded
      let healthy = true;
      let message = `${totalCount} channels`;

      if (totalCount === 0) {
        message = 'No channels configured';
      } else if (hasDisconnected || hasDegraded) {
        healthy = false;
        message = `${connectedCount}/${totalCount} channels connected`;
      } else if (connectedCount === totalCount) {
        message = `All ${totalCount} channels connected`;
      }

      return {
        name: 'whatsapp',
        healthy,
        latency: performance.now() - start,
        message,
        details: {
          total: totalCount,
          byStatus,
          evolutionHealthy: true,
          channels: channels.map((ch) => ({
            id: ch.id,
            name: ch.name,
            status: ch.status,
            phoneNumber: ch.phoneNumber,
            lastHealthCheck: ch.lastHealthCheck,
          })),
        },
      };
    } catch (error) {
      return {
        name: 'whatsapp',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
