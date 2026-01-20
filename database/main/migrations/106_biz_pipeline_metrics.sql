-- Migration: 106_biz_pipeline_metrics
-- Description: Tables for pipeline metrics and monitoring (TASK-6)
-- Creates biz.pipeline_runs, biz.daily_metrics, and biz.alerts tables

-- Pipeline execution tracking
CREATE TABLE biz.pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pipeline identification
  pipeline_name VARCHAR(100) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL DEFAULT 'scheduled',

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,

  -- Stage tracking
  current_stage VARCHAR(100),
  stages_completed JSONB DEFAULT '[]',
  stages_failed JSONB DEFAULT '[]',

  -- Results
  items_processed INT DEFAULT 0,
  items_succeeded INT DEFAULT 0,
  items_failed INT DEFAULT 0,
  items_skipped INT DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  parameters JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}'
);

-- Daily aggregated metrics
CREATE TABLE biz.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,

  -- Pipeline metrics
  pipeline_runs INT DEFAULT 0,
  pipeline_successes INT DEFAULT 0,
  pipeline_failures INT DEFAULT 0,
  avg_duration_ms INT,

  -- Report metrics
  reports_created INT DEFAULT 0,
  reports_approved INT DEFAULT 0,
  reports_rejected INT DEFAULT 0,
  reports_fallback INT DEFAULT 0,
  reports_timeout INT DEFAULT 0,

  -- Review metrics
  avg_review_time_ms INT,
  reviews_on_time INT DEFAULT 0,
  reviews_late INT DEFAULT 0,

  -- Alert metrics
  alerts_triggered INT DEFAULT 0,
  alerts_critical INT DEFAULT 0,
  alerts_warning INT DEFAULT 0,

  -- Patterns detected
  patterns_detected JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE biz.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert identification
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'warning',
  title VARCHAR(500) NOT NULL,
  message TEXT,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Context
  source VARCHAR(100),
  source_id UUID,
  related_data JSONB,

  -- Notification tracking
  notification_sent_at TIMESTAMPTZ,
  notification_channel VARCHAR(50),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for biz.pipeline_runs
CREATE INDEX idx_biz_pipeline_runs_status ON biz.pipeline_runs(status);
CREATE INDEX idx_biz_pipeline_runs_name ON biz.pipeline_runs(pipeline_name);
CREATE INDEX idx_biz_pipeline_runs_started ON biz.pipeline_runs(started_at DESC);
CREATE INDEX idx_biz_pipeline_runs_date ON biz.pipeline_runs(DATE(started_at));

-- Indexes for biz.daily_metrics
CREATE INDEX idx_biz_daily_metrics_date ON biz.daily_metrics(date DESC);

-- Indexes for biz.alerts
CREATE INDEX idx_biz_alerts_status ON biz.alerts(status);
CREATE INDEX idx_biz_alerts_severity ON biz.alerts(severity) WHERE status = 'active';
CREATE INDEX idx_biz_alerts_type ON biz.alerts(type);
CREATE INDEX idx_biz_alerts_created ON biz.alerts(created_at DESC);

-- Comments
COMMENT ON TABLE biz.pipeline_runs IS 'Execution history for automated pipelines';
COMMENT ON COLUMN biz.pipeline_runs.status IS 'running, completed, failed, cancelled';
COMMENT ON COLUMN biz.pipeline_runs.trigger_type IS 'scheduled, manual, webhook, api';

COMMENT ON TABLE biz.daily_metrics IS 'Aggregated daily metrics for dashboards';
COMMENT ON COLUMN biz.daily_metrics.date IS 'Date in YYYY-MM-DD format (unique per day)';

COMMENT ON TABLE biz.alerts IS 'System alerts and notifications';
COMMENT ON COLUMN biz.alerts.severity IS 'info, warning, error, critical';
COMMENT ON COLUMN biz.alerts.status IS 'active, acknowledged, resolved, dismissed';
