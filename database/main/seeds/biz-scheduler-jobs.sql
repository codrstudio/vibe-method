-- Seed: biz-scheduler-jobs.sql
-- Description: Creates scheduled jobs for business operations (TASK-5 & TASK-6)
--
-- Jobs:
-- - biz-pipeline: Main business pipeline (3x daily)
-- - biz-review-timeout: Check for timed out reviews (every 5 min)
-- - biz-check-alerts: Check metrics and create alerts (every 15 min)
-- - biz-daily-metrics: Aggregate daily metrics (midnight)
-- - biz-notify-review: Send review notifications (every 30 min)

-- Main Pipeline: Runs at 12:00, 18:00, 20:00 daily
INSERT INTO scheduled_jobs (
  name, slug, description, category,
  job_target, job_params,
  cron_expression, timezone,
  enabled, timeout_ms, retry_attempts, retry_delay_ms
) VALUES (
  'Pipeline Principal',
  'biz-pipeline',
  'Pipeline principal de processamento de relatorios. Sincroniza dados, processa, notifica e envia.',
  'biz',
  'biz:pipeline',
  '{}',
  '0 12,18,20 * * *',
  'America/Sao_Paulo',
  true,
  300000,  -- 5 minutes timeout
  2,
  10000
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cron_expression = EXCLUDED.cron_expression,
  timeout_ms = EXCLUDED.timeout_ms,
  updated_at = NOW();

-- Review Timeout Check: Every 5 minutes
INSERT INTO scheduled_jobs (
  name, slug, description, category,
  job_target, job_params,
  cron_expression, timezone,
  enabled, timeout_ms, retry_attempts, retry_delay_ms
) VALUES (
  'Verificacao de Timeout de Revisao',
  'biz-review-timeout',
  'Verifica relatorios pendentes que excederam o prazo de revisao e marca como timeout.',
  'biz',
  'biz:review-timeout',
  '{}',
  '*/5 * * * *',
  'America/Sao_Paulo',
  true,
  60000,  -- 1 minute timeout
  1,
  5000
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cron_expression = EXCLUDED.cron_expression,
  updated_at = NOW();

-- Alert Check: Every 15 minutes
INSERT INTO scheduled_jobs (
  name, slug, description, category,
  job_target, job_params,
  cron_expression, timezone,
  enabled, timeout_ms, retry_attempts, retry_delay_ms
) VALUES (
  'Verificacao de Alertas',
  'biz-check-alerts',
  'Analisa metricas do sistema e cria alertas para padroes anomalos.',
  'biz',
  'biz:check-alerts',
  '{}',
  '*/15 * * * *',
  'America/Sao_Paulo',
  true,
  120000,  -- 2 minutes timeout
  2,
  10000
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cron_expression = EXCLUDED.cron_expression,
  updated_at = NOW();

-- Daily Metrics: Midnight
INSERT INTO scheduled_jobs (
  name, slug, description, category,
  job_target, job_params,
  cron_expression, timezone,
  enabled, timeout_ms, retry_attempts, retry_delay_ms
) VALUES (
  'Agregacao de Metricas Diarias',
  'biz-daily-metrics',
  'Agrega metricas do dia anterior e detecta padroes historicos.',
  'biz',
  'biz:daily-metrics',
  '{}',
  '0 0 * * *',
  'America/Sao_Paulo',
  true,
  180000,  -- 3 minutes timeout
  3,
  30000
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cron_expression = EXCLUDED.cron_expression,
  updated_at = NOW();

-- Review Notifications: Every 30 minutes (business hours)
INSERT INTO scheduled_jobs (
  name, slug, description, category,
  job_target, job_params,
  cron_expression, timezone,
  enabled, timeout_ms, retry_attempts, retry_delay_ms
) VALUES (
  'Notificacao de Revisao Pendente',
  'biz-notify-review',
  'Envia notificacoes WhatsApp para revisores quando ha relatorios pendentes.',
  'biz',
  'biz:notify-review',
  '{}',
  '*/30 8-20 * * 1-5',  -- Every 30 min, 8am-8pm, Mon-Fri
  'America/Sao_Paulo',
  true,
  60000,  -- 1 minute timeout
  2,
  10000
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cron_expression = EXCLUDED.cron_expression,
  updated_at = NOW();

-- Summary
-- SELECT slug, name, cron_expression, enabled FROM scheduled_jobs WHERE category = 'biz';
