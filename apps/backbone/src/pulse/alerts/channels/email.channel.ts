import { config } from '../../../config.js';
import type { AlertEvent, ChannelResult } from '../types.js';

interface EmailOptions {
  to: string[];
  subject: string;
  html: string;
}

async function sendEmail(options: EmailOptions): Promise<void> {
  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    throw new Error('SMTP not configured');
  }

  // Dynamic import to avoid loading nodemailer if not needed
  const nodemailer = await import('nodemailer');

  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: config.SMTP_FROM ?? config.SMTP_USER,
    to: options.to.join(', '),
    subject: options.subject,
    html: options.html,
  });
}

function buildAlertEmailHtml(event: AlertEvent): string {
  const statusColor = event.status === 'triggered' ? '#dc2626' : '#16a34a';
  const statusLabel = event.status === 'triggered' ? 'ALERT' : 'RESOLVED';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor}; color: white; padding: 16px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .detail { margin: 8px 0; }
    .label { color: #6b7280; font-size: 12px; text-transform: uppercase; }
    .value { color: #111827; font-size: 16px; font-weight: 500; }
    .footer { margin-top: 20px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 18px;">[${statusLabel}] ${event.alertName}</h1>
    </div>
    <div class="content">
      <div class="detail">
        <div class="label">Condition</div>
        <div class="value">${event.condition.type} - ${event.condition.target}</div>
      </div>
      <div class="detail">
        <div class="label">Triggered At</div>
        <div class="value">${new Date(event.triggeredAt).toLocaleString()}</div>
      </div>
      ${event.resolvedAt ? `
      <div class="detail">
        <div class="label">Resolved At</div>
        <div class="value">${new Date(event.resolvedAt).toLocaleString()}</div>
      </div>
      ` : ''}
      ${event.details ? `
      <div class="detail">
        <div class="label">Details</div>
        <div class="value"><pre style="background: #e5e7eb; padding: 8px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(event.details, null, 2)}</pre></div>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      Sent by ${config.APP_NAME} Pulse Monitor
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendEmailAlert(
  event: AlertEvent,
  recipients: string[]
): Promise<ChannelResult> {
  if (recipients.length === 0) {
    return {
      channel: 'email',
      success: false,
      error: 'No recipients specified',
    };
  }

  try {
    const statusLabel = event.status === 'triggered' ? 'ALERT' : 'RESOLVED';
    await sendEmail({
      to: recipients,
      subject: `[${statusLabel}] ${event.alertName} - ${config.APP_NAME}`,
      html: buildAlertEmailHtml(event),
    });

    return {
      channel: 'email',
      success: true,
    };
  } catch (error) {
    return {
      channel: 'email',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
