-- Migration: Job Scheduler
-- Date: 2026-01-20
-- Description: Creates tables for BullMQ-based job scheduling system

-- scheduled_jobs: configuration for scheduled jobs
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'system',
  job_target VARCHAR(255) NOT NULL,
  job_params JSONB DEFAULT '{}',
  cron_expression VARCHAR(50),
  repeat_every_ms INT,
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  enabled BOOLEAN DEFAULT TRUE,
  timeout_ms INT DEFAULT 300000,
  retry_attempts INT DEFAULT 3,
  retry_delay_ms INT DEFAULT 5000,
  next_run_at TIMESTAMPTZ,
  last_run_id UUID,
  last_run_at TIMESTAMPTZ,
  last_status VARCHAR(20),
  last_duration_ms INT,
  last_error TEXT,
  run_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  fail_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- job_runs: execution history
CREATE TABLE job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
  bullmq_job_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  trigger_type VARCHAR(20) DEFAULT 'scheduled',
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  output JSONB,
  error_message TEXT,
  attempt INT DEFAULT 1
);

-- Indexes for scheduled_jobs
CREATE INDEX idx_scheduled_jobs_slug ON scheduled_jobs(slug);
CREATE INDEX idx_scheduled_jobs_enabled ON scheduled_jobs(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_scheduled_jobs_category ON scheduled_jobs(category);
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at) WHERE enabled = TRUE;

-- Indexes for job_runs
CREATE INDEX idx_job_runs_job_id ON job_runs(job_id);
CREATE INDEX idx_job_runs_status ON job_runs(status);
CREATE INDEX idx_job_runs_started_at ON job_runs(started_at DESC);
CREATE INDEX idx_job_runs_job_started ON job_runs(job_id, started_at DESC);

-- Comments
COMMENT ON TABLE scheduled_jobs IS 'Configuration for scheduled jobs managed by BullMQ';
COMMENT ON COLUMN scheduled_jobs.slug IS 'Unique identifier for the job (used in BullMQ)';
COMMENT ON COLUMN scheduled_jobs.job_target IS 'Target executor identifier (e.g., action:scheduler.cleanup)';
COMMENT ON COLUMN scheduled_jobs.job_params IS 'Parameters passed to the job executor';
COMMENT ON COLUMN scheduled_jobs.cron_expression IS 'Cron expression for scheduling (e.g., 0 0 * * *)';
COMMENT ON COLUMN scheduled_jobs.timezone IS 'Timezone for cron interpretation';
COMMENT ON COLUMN scheduled_jobs.timeout_ms IS 'Maximum execution time in milliseconds';
COMMENT ON COLUMN scheduled_jobs.retry_attempts IS 'Number of retry attempts on failure';
COMMENT ON COLUMN scheduled_jobs.retry_delay_ms IS 'Delay between retries in milliseconds';

COMMENT ON TABLE job_runs IS 'Execution history for scheduled jobs';
COMMENT ON COLUMN job_runs.bullmq_job_id IS 'BullMQ internal job ID';
COMMENT ON COLUMN job_runs.trigger_type IS 'How the job was triggered: scheduled, manual, api';
COMMENT ON COLUMN job_runs.output IS 'JSON output from job execution';
