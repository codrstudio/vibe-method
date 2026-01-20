import { config } from '../../config.js';
import { incCounter } from '../../health/collector.js';
import { channelsRepository } from './repository.js';
import type {
  EvolutionInstance,
  EvolutionQrCode,
  EvolutionConnectionStatus,
  ChannelProvider,
} from './types.js';

// =============================================================================
// Evolution API HTTP Client
// =============================================================================

class EvolutionApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'EvolutionApiError';
  }
}

async function evolutionFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = config.EVOLUTION_API_URL;
  const apiKey = config.EVOLUTION_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new EvolutionApiError('Evolution API not configured');
  }

  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: apiKey,
    ...(options.headers as Record<string, string>),
  };

  try {
    incCounter('evolution.requests');

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      incCounter('evolution.errors');
      const errorBody = await response.text().catch(() => '');
      throw new EvolutionApiError(
        `Evolution API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof EvolutionApiError) {
      throw error;
    }

    incCounter('evolution.errors');
    throw new EvolutionApiError(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// =============================================================================
// WA-SIM HTTP Client
// =============================================================================

const WA_SIM_URL = process.env.WA_SIM_URL || 'http://localhost:8003';

async function simulatorFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${WA_SIM_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    incCounter('simulator.requests');

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      incCounter('simulator.errors');
      const errorBody = await response.text().catch(() => '');
      throw new EvolutionApiError(
        `Simulator API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof EvolutionApiError) {
      throw error;
    }

    incCounter('simulator.errors');
    throw new EvolutionApiError(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// =============================================================================
// Provider Detection
// =============================================================================

async function getProvider(instanceName: string): Promise<ChannelProvider> {
  try {
    const channel = await channelsRepository.findByInstanceName(instanceName);
    if (channel?.provider) {
      return channel.provider;
    }
  } catch {
    // Ignore errors, default to evolution
  }
  return 'evolution';
}

// =============================================================================
// Evolution Client (with Provider Routing)
// =============================================================================

export const evolutionClient = {
  /**
   * Create a new WhatsApp instance
   * Note: provider is determined at channel creation time
   */
  async createInstance(
    instanceName: string,
    webhookUrl?: string,
    provider: ChannelProvider = 'evolution',
    channelName?: string
  ): Promise<{ instanceId: string; instanceName: string }> {
    // Route to simulator if provider is 'simulator'
    if (provider === 'simulator') {
      const response = await simulatorFetch<{
        instanceId: string;
        instanceName: string;
      }>('/instance/create', {
        method: 'POST',
        body: JSON.stringify({
          instanceName,
          webhook: webhookUrl,
          channelName,
        }),
      });

      incCounter('simulator.instances_created');
      return response;
    }

    // Default: Evolution API
    const body: Record<string, unknown> = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    };

    if (webhookUrl) {
      body.webhook = {
        url: webhookUrl,
        webhookByEvents: false,
        webhookBase64: true,
        events: [
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE',
        ],
      };
    }

    const response = await evolutionFetch<{
      instance: {
        instanceName: string;
        instanceId: string;
        status: string;
      };
      hash?: string;
      qrcode?: { base64: string };
    }>('/instance/create', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    incCounter('evolution.instances_created');

    return {
      instanceId: response.instance.instanceId,
      instanceName: response.instance.instanceName,
    };
  },

  /**
   * Get connection status of an instance
   */
  async getConnectionStatus(instanceName: string): Promise<EvolutionConnectionStatus> {
    const provider = await getProvider(instanceName);

    if (provider === 'simulator') {
      const response = await simulatorFetch<{
        state: 'open' | 'close' | 'connecting';
      }>(`/instance/connectionState/${instanceName}`);

      return { state: response.state };
    }

    const response = await evolutionFetch<{
      instance: {
        instanceName: string;
        state: 'open' | 'close' | 'connecting';
      };
    }>(`/instance/connectionState/${instanceName}`);

    return {
      state: response.instance.state,
    };
  },

  /**
   * Get current QR code for an instance
   */
  async getQrCode(instanceName: string): Promise<EvolutionQrCode | null> {
    const provider = await getProvider(instanceName);

    if (provider === 'simulator') {
      try {
        const response = await simulatorFetch<{
          base64?: string;
          code?: string;
        }>(`/instance/connect/${instanceName}`);

        if (response.base64) {
          return {
            base64: response.base64,
            code: response.code,
          };
        }
        return null;
      } catch (error) {
        if (error instanceof EvolutionApiError && error.statusCode === 400) {
          return null;
        }
        throw error;
      }
    }

    try {
      const response = await evolutionFetch<{
        base64?: string;
        code?: string;
        pairingCode?: string;
      }>(`/instance/connect/${instanceName}`);

      if (response.base64) {
        return {
          base64: response.base64,
          code: response.code,
        };
      }

      return null;
    } catch (error) {
      if (error instanceof EvolutionApiError && error.statusCode === 400) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Set webhook for an instance
   */
  async setWebhook(
    instanceName: string,
    webhookUrl: string,
    events: string[] = ['QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT', 'MESSAGES_UPDATE']
  ): Promise<void> {
    const provider = await getProvider(instanceName);

    // Simulator doesn't need webhook configuration (uses env var)
    if (provider === 'simulator') {
      return;
    }

    await evolutionFetch(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          webhookBase64: true,
          events,
        },
      }),
    });
  },

  /**
   * Restart/reconnect an instance
   */
  async restart(instanceName: string): Promise<void> {
    const provider = await getProvider(instanceName);

    if (provider === 'simulator') {
      await simulatorFetch(`/instance/restart/${instanceName}`, {
        method: 'PUT',
      });
      incCounter('simulator.restarts');
      return;
    }

    await evolutionFetch(`/instance/restart/${instanceName}`, {
      method: 'PUT',
    });

    incCounter('evolution.restarts');
  },

  /**
   * Logout from WhatsApp (disconnect session)
   */
  async logout(instanceName: string): Promise<void> {
    const provider = await getProvider(instanceName);

    if (provider === 'simulator') {
      await simulatorFetch(`/instance/logout/${instanceName}`, {
        method: 'DELETE',
      });
      return;
    }

    await evolutionFetch(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
  },

  /**
   * Delete an instance completely
   */
  async deleteInstance(instanceName: string): Promise<void> {
    const provider = await getProvider(instanceName);

    if (provider === 'simulator') {
      await simulatorFetch(`/instance/delete/${instanceName}`, {
        method: 'DELETE',
      });
      incCounter('simulator.instances_deleted');
      return;
    }

    await evolutionFetch(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });

    incCounter('evolution.instances_deleted');
  },

  /**
   * Fetch all instances
   */
  async listInstances(): Promise<EvolutionInstance[]> {
    const response = await evolutionFetch<
      Array<{
        instance: {
          instanceName: string;
          instanceId: string;
          status: string;
        };
      }>
    >('/instance/fetchInstances');

    return response.map((item) => ({
      instanceId: item.instance.instanceId,
      instanceName: item.instance.instanceName,
      status: item.instance.status,
    }));
  },

  /**
   * Send a text message
   */
  async sendTextMessage(
    instanceName: string,
    to: string,
    text: string
  ): Promise<{ messageId: string }> {
    const provider = await getProvider(instanceName);
    const formattedNumber = to.replace(/\D/g, '');

    if (provider === 'simulator') {
      const response = await simulatorFetch<{
        key: { id: string };
      }>(`/message/sendText/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          number: formattedNumber,
          text,
        }),
      });

      incCounter('simulator.messages_sent');
      return { messageId: response.key.id };
    }

    const response = await evolutionFetch<{
      key: {
        id: string;
        remoteJid: string;
      };
      message: unknown;
      messageTimestamp: string;
      status: string;
    }>(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: formattedNumber,
        text,
      }),
    });

    incCounter('evolution.messages_sent');

    return {
      messageId: response.key.id,
    };
  },

  /**
   * Check if Evolution API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!config.EVOLUTION_API_URL || !config.EVOLUTION_API_KEY) {
        return false;
      }

      await this.listInstances();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if Simulator is available
   */
  async simulatorHealthCheck(): Promise<boolean> {
    try {
      const response = await simulatorFetch<{ status: string }>('/health');
      return response.status === 'ok';
    } catch {
      return false;
    }
  },
};

export { EvolutionApiError };
