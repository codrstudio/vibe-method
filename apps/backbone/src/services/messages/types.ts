import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const MessageCategoryEnum = z.enum([
  'auth',
  'notification',
  'alert',
  'transactional',
]);

export const MessageChannelEnum = z.enum(['email', 'whatsapp', 'push']);

export const MessageStatusEnum = z.enum([
  'pending',
  'sent',
  'failed',
  'bounced',
  'delivered',
]);

export const TemplateSourceEnum = z.enum(['default', 'custom']);

// =============================================================================
// Variable Schema
// =============================================================================

export const TemplateVariableSchema = z.object({
  key: z.string(),
  label: z.string(),
  example: z.string().optional(),
  required: z.boolean().default(false),
});

// =============================================================================
// Channel Schemas
// =============================================================================

export const EmailChannelSchema = z.object({
  enabled: z.boolean().default(false),
  subject: z.string().optional(),
  body_html: z.string().optional(),
  body_text: z.string().optional(),
});

export const WhatsAppChannelSchema = z.object({
  enabled: z.boolean().default(false),
  body: z.string().nullable().optional(),
});

export const PushChannelSchema = z.object({
  enabled: z.boolean().default(false),
  title: z.string().optional(),
  body: z.string().optional(),
});

export const ChannelsSchema = z.object({
  email: EmailChannelSchema.optional(),
  whatsapp: WhatsAppChannelSchema.optional(),
  push: PushChannelSchema.optional(),
});

// =============================================================================
// Template Schema
// =============================================================================

export const MessageTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: MessageCategoryEnum,
  channels: ChannelsSchema,
  variables: z.array(TemplateVariableSchema),
  settings: z.record(z.unknown()).default({}),
  source: TemplateSourceEnum.default('default'),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

// =============================================================================
// Input Schemas
// =============================================================================

export const UpdateTemplateSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  channels: ChannelsSchema.optional(),
  settings: z.record(z.unknown()).optional(),
});

export const SendMessageSchema = z.object({
  templateId: z.string(),
  channel: MessageChannelEnum,
  recipient: z.string(),
  variables: z.record(z.string()),
});

export const PreviewTemplateSchema = z.object({
  templateId: z.string(),
  channel: MessageChannelEnum.default('email'),
  variables: z.record(z.string()).optional(),
});

// =============================================================================
// Log Schema
// =============================================================================

export const MessageLogSchema = z.object({
  id: z.string().uuid(),
  template_id: z.string().nullable(),
  channel: MessageChannelEnum,
  recipient: z.string(),
  variables: z.record(z.unknown()),
  status: MessageStatusEnum,
  error_message: z.string().nullable().optional(),
  error_code: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().or(z.date()),
  sent_at: z.string().or(z.date()).nullable().optional(),
});

// =============================================================================
// Types
// =============================================================================

export type MessageCategory = z.infer<typeof MessageCategoryEnum>;
export type MessageChannel = z.infer<typeof MessageChannelEnum>;
export type MessageStatus = z.infer<typeof MessageStatusEnum>;
export type TemplateSource = z.infer<typeof TemplateSourceEnum>;

export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type EmailChannel = z.infer<typeof EmailChannelSchema>;
export type WhatsAppChannel = z.infer<typeof WhatsAppChannelSchema>;
export type Channels = z.infer<typeof ChannelsSchema>;

export type MessageTemplate = z.infer<typeof MessageTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type PreviewTemplateInput = z.infer<typeof PreviewTemplateSchema>;
export type MessageLog = z.infer<typeof MessageLogSchema>;

// =============================================================================
// Rendered Message
// =============================================================================

export interface RenderedEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface RenderedWhatsApp {
  to: string;
  body: string;
}

// =============================================================================
// Global Variables (sempre disponíveis em templates)
// =============================================================================

export interface GlobalVariables {
  app_name: string;
  app_url: string;
  current_year: string;
  support_email: string;
}
