import { config } from '../../config.js';
import { incCounter } from '../../health/collector.js';
import { messagesService } from '../messages/index.js';
import { repository as notificationsRepository } from '../notifications/index.js';
import { assignmentsRepository, operationsRepository } from './repository.js';
import { DISCONNECT_REASONS } from './types.js';
import type { Channel, AlertType, AlertRecipient, AlertTemplate } from './types.js';

// =============================================================================
// Alert Templates
// =============================================================================

function getDisconnectReasonText(reason: number | null): string {
  if (!reason) return 'Motivo desconhecido';

  switch (reason) {
    case DISCONNECT_REASONS.LOGGED_OUT:
      return 'Deslogado no celular (401)';
    case DISCONNECT_REASONS.CONNECTION_REPLACED:
      return 'Conexao substituida por outra sessao (440)';
    case DISCONNECT_REASONS.BAD_SESSION:
      return 'Sessao corrompida (500)';
    case DISCONNECT_REASONS.TIMED_OUT:
      return 'Timeout de conexao (408)';
    case DISCONNECT_REASONS.CONNECTION_CLOSED:
      return 'Conexao fechada (428)';
    case DISCONNECT_REASONS.UNAVAILABLE_SERVICE:
      return 'Servico indisponivel (503)';
    case DISCONNECT_REASONS.RESTART_REQUIRED:
      return 'Reinicializacao necessaria (515)';
    default:
      return `Codigo ${reason}`;
  }
}

function getAlertTemplate(
  type: AlertType,
  channel: Channel,
  reason?: number | null
): AlertTemplate {
  const reasonText = getDisconnectReasonText(reason ?? null);
  const baseUrl = config.APP_BASE_URL;
  const channelUrl = `${baseUrl}/settings/whatsapp/channels/${channel.id}`;

  switch (type) {
    case 'degraded':
      return {
        subject: `[ATENCAO] WhatsApp "${channel.name}" com problemas`,
        body: `O canal WhatsApp "${channel.name}" esta com problemas de conexao.

Status: Degradado (tentando reconectar automaticamente)
Motivo: ${reasonText}
Tentativa: ${channel.retryCount}/${5}

Acoes em andamento:
- Reconexao automatica ativa
- Monitoramento em tempo real

Se o problema persistir, voce sera notificado para escanear novo QR code.

Acessar: ${channelUrl}`,
        sms: `[WhatsApp] Canal "${channel.name}" degradado. Tentando reconectar. Verifique: ${channelUrl}`,
      };

    case 'disconnected':
      return {
        subject: `[URGENTE] WhatsApp "${channel.name}" desconectado - Acao necessaria`,
        body: `O canal WhatsApp "${channel.name}" foi desconectado e requer acao manual.

Motivo: ${reasonText}

ACAO NECESSARIA: Escanear novo QR Code

Acesse o painel para reconectar: ${channelUrl}

Este canal pode ter operacoes que dependem dele. Verifique o status das atribuicoes.`,
        sms: `[URGENTE] WhatsApp "${channel.name}" desconectado! Escaneie QR Code: ${channelUrl}`,
      };

    case 'reconnected':
      return {
        subject: `[OK] WhatsApp "${channel.name}" reconectado`,
        body: `O canal WhatsApp "${channel.name}" foi reconectado com sucesso.

Status: Conectado
Numero: ${channel.phoneNumber || 'N/A'}

O servico foi restaurado automaticamente.

Acessar: ${channelUrl}`,
        sms: `[OK] WhatsApp "${channel.name}" reconectado com sucesso.`,
      };
  }
}

// =============================================================================
// Alert Service
// =============================================================================

export const alertService = {
  /**
   * Send alert for a channel status change
   */
  async sendAlert(
    type: AlertType,
    channel: Channel,
    reason?: number | null
  ): Promise<void> {
    try {
      // Get all assignments for this channel
      const assignments = await assignmentsRepository.findByChannel(channel.id);

      // Collect unique recipients
      const recipientMap = new Map<string, AlertRecipient>();

      for (const assignment of assignments) {
        // Add email/phone from assignment
        if (assignment.notificationEmail) {
          const key = `email:${assignment.notificationEmail}`;
          if (!recipientMap.has(key)) {
            recipientMap.set(key, { email: assignment.notificationEmail });
          }
        }

        if (assignment.notificationPhone) {
          const key = `phone:${assignment.notificationPhone}`;
          if (!recipientMap.has(key)) {
            recipientMap.set(key, { phone: assignment.notificationPhone });
          }
        }

        // Add userId for in-app notification
        if (assignment.userId) {
          const key = `user:${assignment.userId}`;
          const existing = recipientMap.get(key);
          if (existing) {
            existing.userId = assignment.userId;
          } else {
            recipientMap.set(key, { userId: assignment.userId });
          }
        }
      }

      const recipients = Array.from(recipientMap.values());
      const template = getAlertTemplate(type, channel, reason);

      // Send to each recipient
      const promises: Promise<void>[] = [];

      for (const recipient of recipients) {
        // Email
        if (recipient.email) {
          promises.push(
            this.sendEmailAlert(recipient.email, template).catch((err) =>
              console.error(`Failed to send email alert to ${recipient.email}:`, err)
            )
          );
        }

        // SMS (only for disconnected - critical)
        if (recipient.phone && type === 'disconnected' && template.sms) {
          promises.push(
            this.sendSmsAlert(recipient.phone, template.sms).catch((err) =>
              console.error(`Failed to send SMS alert to ${recipient.phone}:`, err)
            )
          );
        }

        // In-app notification
        if (recipient.userId) {
          promises.push(
            this.sendInAppAlert(recipient.userId, type, channel, template).catch((err) =>
              console.error(`Failed to send in-app alert to ${recipient.userId}:`, err)
            )
          );
        }
      }

      await Promise.all(promises);

      incCounter('whatsapp.alerts_sent', recipients.length, { type });
    } catch (error) {
      console.error(`Failed to send ${type} alert for channel ${channel.id}:`, error);
      incCounter('whatsapp.alerts_failed');
    }
  },

  /**
   * Send email alert using message templates
   */
  async sendEmailAlert(email: string, template: AlertTemplate): Promise<void> {
    // Use message service with a generic alert template
    const result = await messagesService.send({
      templateId: 'system-alert',
      channel: 'email',
      recipient: email,
      variables: {
        alert_subject: template.subject,
        alert_body: template.body.replace(/\n/g, '<br>'),
        user_email: email,
      },
    });

    if (!result.success) {
      // Fallback: try direct email if template doesn't exist
      console.warn(`Template system-alert not found, alert not sent to ${email}`);
    }
  },

  /**
   * Send SMS alert (placeholder - needs SMS provider integration)
   */
  async sendSmsAlert(phone: string, message: string): Promise<void> {
    // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
    console.log(`[SMS Alert] To: ${phone}, Message: ${message}`);
    incCounter('whatsapp.sms_alerts');
  },

  /**
   * Send in-app notification
   */
  async sendInAppAlert(
    userId: string,
    type: AlertType,
    channel: Channel,
    template: AlertTemplate
  ): Promise<void> {
    const notificationType = type === 'disconnected' ? 'error' : type === 'degraded' ? 'warning' : 'info';

    await notificationsRepository.create({
      userId,
      type: notificationType,
      title: template.subject,
      message: template.body.substring(0, 500), // Truncate for notification
      actionUrl: `/settings/whatsapp/channels/${channel.id}`,
      metadata: {
        channelId: channel.id,
        channelName: channel.name,
        alertType: type,
      },
    });

    incCounter('whatsapp.inapp_alerts');
  },

  /**
   * Broadcast alert to all connected clients (for real-time UI updates)
   * This should be called from the webhook handler to notify the UI
   */
  getAlertPayload(
    type: AlertType,
    channel: Channel,
    reason?: number | null
  ): {
    channelId: string;
    channelName: string;
    type: AlertType;
    message: string;
    reason: string | null;
    timestamp: string;
  } {
    const template = getAlertTemplate(type, channel, reason);

    return {
      channelId: channel.id,
      channelName: channel.name,
      type,
      message: template.subject,
      reason: reason ? getDisconnectReasonText(reason) : null,
      timestamp: new Date().toISOString(),
    };
  },
};
