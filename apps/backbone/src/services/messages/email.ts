import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../../config.js';
import { incCounter, startTimer } from '../../health/collector.js';
import type { RenderedEmail } from './types.js';

// =============================================================================
// SMTP Transporter
// =============================================================================

let transporter: Transporter | null = null;

/**
 * Inicializa o transporter SMTP
 * Lazy initialization para não falhar se SMTP não estiver configurado
 */
function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    throw new Error(
      'SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in environment.'
    );
  }

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  return transporter;
}

// =============================================================================
// Email Service
// =============================================================================

export const emailService = {
  /**
   * Verifica se SMTP está configurado
   */
  isConfigured(): boolean {
    return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
  },

  /**
   * Verifica conexão com servidor SMTP
   */
  async verify(): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const transport = getTransporter();
      await transport.verify();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Envia email
   */
  async send(email: RenderedEmail): Promise<{ messageId: string }> {
    const stopTimer = startTimer('email.send.latency');
    incCounter('email.send.attempts');

    try {
      const transport = getTransporter();

      const result = await transport.sendMail({
        from: config.SMTP_FROM || config.SMTP_USER,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });

      stopTimer();
      incCounter('email.send.success');

      return { messageId: result.messageId };
    } catch (error) {
      stopTimer();
      incCounter('email.send.errors');
      throw error;
    }
  },

  /**
   * Envia email em modo preview (não envia de verdade, retorna o que seria enviado)
   */
  preview(email: RenderedEmail): {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  } {
    return {
      from: config.SMTP_FROM || config.SMTP_USER || 'noreply@example.com',
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    };
  },
};
