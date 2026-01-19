-- Seed: 002_message_templates
-- Description: Templates padrao de mensagens do sistema
-- Source: specs/messages/*.yaml
--
-- NOTA: Este seed reflete o conteudo dos arquivos YAML.
-- Se os YAMLs forem atualizados, este seed deve ser regenerado.
-- Templates com source='custom' nao sao sobrescritos.

-- =============================================================================
-- Template: OTP de Login
-- Source: specs/messages/otp-login.yaml
-- =============================================================================
INSERT INTO message_templates (id, name, description, category, channels, variables, settings, source)
VALUES (
  'otp-login',
  'OTP de Login',
  'Codigo de verificacao enviado durante o login',
  'auth',
  '{
    "email": {
      "enabled": true,
      "subject": "{{otp_code}} - Seu codigo de acesso",
      "body_html": "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head><body style=\"font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;\"><div style=\"max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);\"><div style=\"background: #18181b; padding: 24px; text-align: center;\"><h1 style=\"color: white; margin: 0; font-size: 20px; font-weight: 600;\">{{app_name}}</h1></div><div style=\"padding: 32px 24px;\"><p style=\"color: #3f3f46; font-size: 16px; margin: 0 0 24px;\">Ola <strong>{{user_name}}</strong>,</p><p style=\"color: #3f3f46; font-size: 16px; margin: 0 0 24px;\">Use o codigo abaixo para acessar sua conta:</p><div style=\"background: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;\"><span style=\"font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b;\">{{otp_code}}</span></div><p style=\"color: #71717a; font-size: 14px; margin: 0 0 8px;\">Este codigo expira em <strong>{{ttl_minutes}} minutos</strong>.</p><p style=\"color: #71717a; font-size: 14px; margin: 0;\">Se voce nao solicitou este codigo, ignore este email.</p></div><div style=\"background: #fafafa; padding: 16px 24px; border-top: 1px solid #e4e4e7;\"><p style=\"color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;\">{{app_name}} &bull; {{current_year}}</p></div></div></body></html>",
      "body_text": "Ola {{user_name}},\n\nUse o codigo abaixo para acessar sua conta:\n\n{{otp_code}}\n\nEste codigo expira em {{ttl_minutes}} minutos.\n\nSe voce nao solicitou este codigo, ignore este email.\n\n--\n{{app_name}}"
    },
    "whatsapp": {
      "enabled": false,
      "body": "*{{app_name}}*\n\nSeu codigo de acesso: *{{otp_code}}*\n\nValido por {{ttl_minutes}} minutos."
    }
  }'::jsonb,
  '[
    {"key": "user_name", "label": "Nome do usuario", "example": "Joao Silva", "required": true},
    {"key": "user_email", "label": "Email do usuario", "example": "joao@email.com", "required": true},
    {"key": "otp_code", "label": "Codigo OTP", "example": "482951", "required": true},
    {"key": "ttl_minutes", "label": "Tempo de expiracao (minutos)", "example": "5", "required": true}
  ]'::jsonb,
  '{"otp_length": 6, "ttl_minutes": 5}'::jsonb,
  'default'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  channels = CASE WHEN message_templates.source = 'default' THEN EXCLUDED.channels ELSE message_templates.channels END,
  variables = EXCLUDED.variables,
  settings = CASE WHEN message_templates.source = 'default' THEN EXCLUDED.settings ELSE message_templates.settings END,
  updated_at = NOW()
WHERE message_templates.source = 'default';

-- =============================================================================
-- Template: Boas-vindas
-- Source: specs/messages/welcome.yaml
-- =============================================================================
INSERT INTO message_templates (id, name, description, category, channels, variables, settings, source)
VALUES (
  'welcome',
  'Boas-vindas',
  'Email de boas-vindas enviado apos cadastro',
  'auth',
  '{
    "email": {
      "enabled": true,
      "subject": "Bem-vindo ao {{app_name}}!",
      "body_html": "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head><body style=\"font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;\"><div style=\"max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);\"><div style=\"background: #18181b; padding: 24px; text-align: center;\"><h1 style=\"color: white; margin: 0; font-size: 20px; font-weight: 600;\">{{app_name}}</h1></div><div style=\"padding: 32px 24px;\"><h2 style=\"color: #18181b; font-size: 24px; margin: 0 0 16px;\">Bem-vindo, {{user_name}}!</h2><p style=\"color: #3f3f46; font-size: 16px; margin: 0 0 24px; line-height: 1.6;\">Sua conta foi criada com sucesso. Estamos felizes em ter voce conosco.</p><p style=\"color: #3f3f46; font-size: 16px; margin: 0 0 24px; line-height: 1.6;\">Para comecar, acesse o painel e explore as funcionalidades disponiveis.</p><div style=\"text-align: center; margin: 32px 0;\"><a href=\"{{app_url}}/dashboard\" style=\"display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;\">Acessar Painel</a></div><p style=\"color: #71717a; font-size: 14px; margin: 0;\">Precisa de ajuda? Entre em contato pelo {{support_email}}.</p></div><div style=\"background: #fafafa; padding: 16px 24px; border-top: 1px solid #e4e4e7;\"><p style=\"color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;\">{{app_name}} &bull; {{current_year}}</p></div></div></body></html>",
      "body_text": "Bem-vindo, {{user_name}}!\n\nSua conta foi criada com sucesso. Estamos felizes em ter voce conosco.\n\nPara comecar, acesse o painel:\n{{app_url}}/dashboard\n\nPrecisa de ajuda? Entre em contato pelo {{support_email}}.\n\n--\n{{app_name}}"
    },
    "whatsapp": {
      "enabled": false,
      "body": "Ola {{user_name}}!\n\nBem-vindo ao *{{app_name}}*!\n\nSua conta foi criada com sucesso. Acesse: {{app_url}}"
    }
  }'::jsonb,
  '[
    {"key": "user_name", "label": "Nome do usuario", "example": "Joao Silva", "required": true}
  ]'::jsonb,
  '{}'::jsonb,
  'default'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  channels = CASE WHEN message_templates.source = 'default' THEN EXCLUDED.channels ELSE message_templates.channels END,
  variables = EXCLUDED.variables,
  settings = CASE WHEN message_templates.source = 'default' THEN EXCLUDED.settings ELSE message_templates.settings END,
  updated_at = NOW()
WHERE message_templates.source = 'default';

-- =============================================================================
-- Template: Reset de Senha
-- Source: specs/messages/password-reset.yaml
-- =============================================================================
INSERT INTO message_templates (id, name, description, category, channels, variables, settings, source)
VALUES (
  'password-reset',
  'Reset de Senha',
  'Email com link para redefinir senha',
  'auth',
  '{
    "email": {
      "enabled": true,
      "subject": "Redefinir sua senha - {{app_name}}",
      "body_html": "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head><body style=\"font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;\"><div style=\"max-width: 480px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);\"><div style=\"background: #18181b; padding: 24px; text-align: center;\"><h1 style=\"color: white; margin: 0; font-size: 20px; font-weight: 600;\">{{app_name}}</h1></div><div style=\"padding: 32px 24px;\"><p style=\"color: #3f3f46; font-size: 16px; margin: 0 0 24px;\">Ola <strong>{{user_name}}</strong>,</p><p style=\"color: #3f3f46; font-size: 16px; margin: 0 0 24px; line-height: 1.6;\">Recebemos uma solicitacao para redefinir a senha da sua conta.</p><div style=\"text-align: center; margin: 32px 0;\"><a href=\"{{reset_url}}\" style=\"display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;\">Redefinir Senha</a></div><p style=\"color: #71717a; font-size: 14px; margin: 0 0 8px;\">Este link expira em <strong>{{ttl_minutes}} minutos</strong>.</p><p style=\"color: #71717a; font-size: 14px; margin: 0 0 16px;\">Se voce nao solicitou a redefinicao de senha, ignore este email. Sua senha permanecera inalterada.</p><div style=\"background: #f4f4f5; border-radius: 6px; padding: 12px; margin-top: 24px;\"><p style=\"color: #71717a; font-size: 12px; margin: 0 0 8px;\">Se o botao nao funcionar, copie e cole este link no navegador:</p><p style=\"color: #3f3f46; font-size: 12px; margin: 0; word-break: break-all;\">{{reset_url}}</p></div></div><div style=\"background: #fafafa; padding: 16px 24px; border-top: 1px solid #e4e4e7;\"><p style=\"color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;\">{{app_name}} &bull; {{current_year}}</p></div></div></body></html>",
      "body_text": "Ola {{user_name}},\n\nRecebemos uma solicitacao para redefinir a senha da sua conta.\n\nClique no link abaixo para criar uma nova senha:\n{{reset_url}}\n\nEste link expira em {{ttl_minutes}} minutos.\n\nSe voce nao solicitou a redefinicao de senha, ignore este email.\n\n--\n{{app_name}}"
    },
    "whatsapp": {
      "enabled": false,
      "body": null
    }
  }'::jsonb,
  '[
    {"key": "user_name", "label": "Nome do usuario", "example": "Joao Silva", "required": true},
    {"key": "reset_url", "label": "URL de reset", "example": "https://app.com/reset?token=abc123", "required": true},
    {"key": "ttl_minutes", "label": "Tempo de expiracao (minutos)", "example": "30", "required": true}
  ]'::jsonb,
  '{"ttl_minutes": 30}'::jsonb,
  'default'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  channels = CASE WHEN message_templates.source = 'default' THEN EXCLUDED.channels ELSE message_templates.channels END,
  variables = EXCLUDED.variables,
  settings = CASE WHEN message_templates.source = 'default' THEN EXCLUDED.settings ELSE message_templates.settings END,
  updated_at = NOW()
WHERE message_templates.source = 'default';
