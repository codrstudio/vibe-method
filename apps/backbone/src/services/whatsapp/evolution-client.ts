import { config } from '../../config.js';
import { incCounter } from '../../health/collector.js';
import type {
  EvolutionInstance,
  EvolutionQrCode,
  EvolutionConnectionStatus,
} from './types.js';

// =============================================================================
// Evolution API HTTP Client
// =============================================================================

interface EvolutionApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    apikey: apiKey,
    ...options.headers,
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
// Evolution Client
// =============================================================================

export const evolutionClient = {
  /**
   * Create a new WhatsApp instance
   */
  async createInstance(
    instanceName: string,
    webhookUrl?: string
  ): Promise<{ instanceId: string; instanceName: string }> {
    const body: Record<string, unknown> = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    };

    // Configure webhook if provided
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
      // Instance might be connected already
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
    await evolutionFetch(`/instance/restart/${instanceName}`, {
      method: 'PUT',
    });

    incCounter('evolution.restarts');
  },

  /**
   * Logout from WhatsApp (disconnect session)
   */
  async logout(instanceName: string): Promise<void> {
    await evolutionFetch(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
  },

  /**
   * Delete an instance completely
   */
  async deleteInstance(instanceName: string): Promise<void> {
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
    // Format number (remove non-digits, ensure country code)
    const formattedNumber = to.replace(/\D/g, '');

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

      // Try to list instances as a health check
      await this.listInstances();
      return true;
    } catch {
      return false;
    }
  },
};

export { EvolutionApiError };
