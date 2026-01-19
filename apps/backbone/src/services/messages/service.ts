import { config } from '../../config.js';
import { incCounter } from '../../health/collector.js';
import { templatesRepository, logsRepository } from './repository.js';
import { emailService } from './email.js';
import type {
  MessageTemplate,
  UpdateTemplateInput,
  SendMessageInput,
  PreviewTemplateInput,
  GlobalVariables,
  RenderedEmail,
  MessageChannel,
} from './types.js';

// =============================================================================
// Template Rendering
// =============================================================================

/**
 * Variáveis globais disponíveis em todos os templates
 */
function getGlobalVariables(): GlobalVariables {
  return {
    app_name: config.APP_NAME,
    app_url: config.APP_BASE_URL,
    current_year: new Date().getFullYear().toString(),
    support_email: config.SUPPORT_EMAIL || `suporte@${config.APP_NAME.toLowerCase().replace(/\s/g, '')}.com`,
  };
}

/**
 * Renderiza template substituindo variáveis
 * Usa sintaxe {{variable}}
 */
function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  const allVars = { ...getGlobalVariables(), ...variables };

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return allVars[key as keyof typeof allVars] ?? match;
  });
}

/**
 * Mascara dados sensíveis para log
 */
function maskSensitiveData(
  variables: Record<string, string>
): Record<string, string> {
  const sensitiveKeys = ['otp_code', 'password', 'token', 'secret'];
  const masked = { ...variables };

  for (const key of sensitiveKeys) {
    if (masked[key]) {
      masked[key] = '***';
    }
  }

  return masked;
}

// =============================================================================
// Templates Service
// =============================================================================

export const templatesService = {
  /**
   * Lista todos os templates
   */
  async list(): Promise<MessageTemplate[]> {
    return templatesRepository.findAll();
  },

  /**
   * Lista templates por categoria
   */
  async listByCategory(category: string): Promise<MessageTemplate[]> {
    return templatesRepository.findByCategory(category);
  },

  /**
   * Busca template por ID
   */
  async get(id: string): Promise<MessageTemplate | null> {
    return templatesRepository.findById(id);
  },

  /**
   * Atualiza template
   */
  async update(
    id: string,
    data: UpdateTemplateInput,
    updatedBy?: string
  ): Promise<MessageTemplate | null> {
    incCounter('templates.updated');
    return templatesRepository.update(id, data, updatedBy);
  },

  /**
   * Reset para template padrão
   */
  async reset(id: string): Promise<boolean> {
    incCounter('templates.reset');
    return templatesRepository.resetToDefault(id);
  },

  /**
   * Gera preview do template renderizado
   */
  async preview(input: PreviewTemplateInput): Promise<{
    channel: MessageChannel;
    rendered: RenderedEmail | { body: string };
  } | null> {
    const template = await templatesRepository.findById(input.templateId);
    if (!template) return null;

    const channel = input.channel || 'email';
    const channelConfig = template.channels[channel];

    if (!channelConfig?.enabled && channel !== 'email') {
      return null;
    }

    // Usa exemplos das variáveis se não fornecidas
    const variables: Record<string, string> = { ...input.variables };
    for (const v of template.variables) {
      if (!variables[v.key] && v.example) {
        variables[v.key] = v.example;
      }
    }

    if (channel === 'email' && template.channels.email) {
      const emailConfig = template.channels.email;
      return {
        channel: 'email',
        rendered: {
          to: variables.user_email || 'exemplo@email.com',
          subject: renderTemplate(emailConfig.subject || '', variables),
          html: renderTemplate(emailConfig.body_html || '', variables),
          text: renderTemplate(emailConfig.body_text || '', variables),
        },
      };
    }

    if (channel === 'whatsapp' && template.channels.whatsapp?.body) {
      return {
        channel: 'whatsapp',
        rendered: {
          body: renderTemplate(template.channels.whatsapp.body, variables),
        },
      };
    }

    return null;
  },
};

// =============================================================================
// Messages Service (Motor de Envio)
// =============================================================================

export const messagesService = {
  /**
   * Envia mensagem usando template
   */
  async send(input: SendMessageInput): Promise<{
    success: boolean;
    logId: string;
    messageId?: string;
    error?: string;
  }> {
    const template = await templatesRepository.findById(input.templateId);

    if (!template) {
      return {
        success: false,
        logId: '',
        error: `Template not found: ${input.templateId}`,
      };
    }

    const channelConfig = template.channels[input.channel];

    if (!channelConfig?.enabled) {
      return {
        success: false,
        logId: '',
        error: `Channel ${input.channel} not enabled for template ${input.templateId}`,
      };
    }

    // Cria log inicial
    const log = await logsRepository.create({
      templateId: input.templateId,
      channel: input.channel,
      recipient: input.recipient,
      variables: maskSensitiveData(input.variables),
      status: 'pending',
    });

    try {
      if (input.channel === 'email' && template.channels.email) {
        const emailConfig = template.channels.email;

        const rendered: RenderedEmail = {
          to: input.recipient,
          subject: renderTemplate(emailConfig.subject || '', input.variables),
          html: renderTemplate(emailConfig.body_html || '', input.variables),
          text: renderTemplate(emailConfig.body_text || '', input.variables),
        };

        const result = await emailService.send(rendered);

        await logsRepository.updateStatus(log.id, 'sent');
        incCounter('messages.sent.email');

        return {
          success: true,
          logId: log.id,
          messageId: result.messageId,
        };
      }

      // WhatsApp não implementado ainda
      if (input.channel === 'whatsapp') {
        await logsRepository.updateStatus(log.id, 'failed', {
          message: 'WhatsApp channel not implemented',
          code: 'NOT_IMPLEMENTED',
        });

        return {
          success: false,
          logId: log.id,
          error: 'WhatsApp channel not implemented',
        };
      }

      return {
        success: false,
        logId: log.id,
        error: `Unknown channel: ${input.channel}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await logsRepository.updateStatus(log.id, 'failed', {
        message: errorMessage,
        code: 'SEND_ERROR',
      });

      incCounter('messages.errors');

      return {
        success: false,
        logId: log.id,
        error: errorMessage,
      };
    }
  },

  /**
   * Envia OTP por email
   * Convenience method que usa o template otp-login
   */
  async sendOtp(
    email: string,
    userName: string,
    otpCode: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.send({
      templateId: 'otp-login',
      channel: 'email',
      recipient: email,
      variables: {
        user_name: userName,
        user_email: email,
        otp_code: otpCode,
        ttl_minutes: config.OTP_TTL_MINUTES.toString(),
      },
    });

    return {
      success: result.success,
      error: result.error,
    };
  },

  /**
   * Envia email de boas-vindas
   */
  async sendWelcome(
    email: string,
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.send({
      templateId: 'welcome',
      channel: 'email',
      recipient: email,
      variables: {
        user_name: userName,
        user_email: email,
      },
    });

    return {
      success: result.success,
      error: result.error,
    };
  },

  /**
   * Envia email de reset de senha
   */
  async sendPasswordReset(
    email: string,
    userName: string,
    resetUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await this.send({
      templateId: 'password-reset',
      channel: 'email',
      recipient: email,
      variables: {
        user_name: userName,
        user_email: email,
        reset_url: resetUrl,
        ttl_minutes: '30',
      },
    });

    return {
      success: result.success,
      error: result.error,
    };
  },
};
