-- Migration: 105_biz_reports_review
-- Description: Tables for human review system (TASK-5)
-- Creates biz.reports and biz.review_history tables

-- Reports table for items pending human review
CREATE TABLE biz.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source identification
  external_id VARCHAR(255),
  source VARCHAR(100) NOT NULL DEFAULT 'manual',

  -- Content
  title VARCHAR(500) NOT NULL,
  content TEXT,
  original_data JSONB,

  -- Review status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  review_deadline TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Decision
  decision VARCHAR(50),
  decision_reason TEXT,
  fallback_text TEXT,

  -- AI analysis
  ai_confidence DECIMAL(5, 2),
  ai_suggestion TEXT,
  ai_analysis JSONB,

  -- Notification tracking
  notification_sent_at TIMESTAMPTZ,
  notification_count INT DEFAULT 0,

  -- Metadata
  priority INT DEFAULT 0,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review history for audit trail
CREATE TABLE biz.review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES biz.reports(id) ON DELETE CASCADE,

  -- Action
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),

  -- User info
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(255),

  -- Details
  reason TEXT,
  changes JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for biz.reports
CREATE INDEX idx_biz_reports_status ON biz.reports(status);
CREATE INDEX idx_biz_reports_deadline ON biz.reports(review_deadline) WHERE status = 'pending';
CREATE INDEX idx_biz_reports_priority ON biz.reports(priority DESC, created_at ASC);
CREATE INDEX idx_biz_reports_source ON biz.reports(source);
CREATE INDEX idx_biz_reports_external_id ON biz.reports(external_id);
CREATE INDEX idx_biz_reports_created_at ON biz.reports(created_at DESC);

-- Indexes for biz.review_history
CREATE INDEX idx_biz_review_history_report ON biz.review_history(report_id);
CREATE INDEX idx_biz_review_history_created ON biz.review_history(created_at DESC);

-- Comments
COMMENT ON TABLE biz.reports IS 'Reports pending human review';
COMMENT ON COLUMN biz.reports.status IS 'pending, approved, rejected, fallback, timeout, processing';
COMMENT ON COLUMN biz.reports.decision IS 'approve, reject, fallback';
COMMENT ON COLUMN biz.reports.ai_confidence IS 'AI confidence score (0-100)';
COMMENT ON COLUMN biz.reports.priority IS 'Higher priority = reviewed first';

COMMENT ON TABLE biz.review_history IS 'Audit trail for review actions';
COMMENT ON COLUMN biz.review_history.action IS 'created, status_changed, notified, timeout, approved, rejected, fallback';
