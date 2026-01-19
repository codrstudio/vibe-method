-- Migration: Notifications table
-- Date: 2026-01-19
-- Description: Creates the notifications table for user alerts and task notifications

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'task')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'archived')),
  metadata JSONB,
  action_url VARCHAR(500),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient user-based queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Composite index for filtering by user and status
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);

-- Index for chronological ordering
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
