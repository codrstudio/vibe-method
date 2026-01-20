-- Migration: Tasks evolution for notifications
-- Date: 2026-01-20
-- Description: Extends notifications table to support Tasks with class-based workflows

-- Add new columns to notifications table
ALTER TABLE notifications
  ADD COLUMN class VARCHAR(100),
  ADD COLUMN meta_tags JSONB DEFAULT '[]',
  ADD COLUMN tags JSONB DEFAULT '[]',
  ADD COLUMN workflow JSONB DEFAULT '{}',
  ADD COLUMN color VARCHAR(20),
  ADD COLUMN icon VARCHAR(50),
  ADD COLUMN assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN due_at TIMESTAMPTZ,
  ADD COLUMN closed_at TIMESTAMPTZ;

-- Index for class-based filtering (only for rows with class)
CREATE INDEX idx_notifications_class ON notifications(class) WHERE class IS NOT NULL;

-- Index for assignee-based queries
CREATE INDEX idx_notifications_assignee ON notifications(assignee_id) WHERE assignee_id IS NOT NULL;

-- GIN index for tags array queries (for filtering by tag values)
CREATE INDEX idx_notifications_tags ON notifications USING GIN(tags);

-- Index for due date queries (open tasks with due dates)
CREATE INDEX idx_notifications_due_at ON notifications(due_at) WHERE due_at IS NOT NULL AND closed_at IS NULL;

-- Comment explaining the task model
COMMENT ON COLUMN notifications.class IS 'Task class name (e.g., document-approval). NULL means regular notification';
COMMENT ON COLUMN notifications.meta_tags IS 'System-managed tags: class, priority, assignee info';
COMMENT ON COLUMN notifications.tags IS 'Lifecycle tags: open, pending, closed, custom states';
COMMENT ON COLUMN notifications.workflow IS 'Workflow definition copied from class schema';
COMMENT ON COLUMN notifications.color IS 'Visual color for the task (hex or named)';
COMMENT ON COLUMN notifications.icon IS 'Lucide icon name for the task';
COMMENT ON COLUMN notifications.assignee_id IS 'User assigned to this task';
COMMENT ON COLUMN notifications.due_at IS 'Due date for the task';
COMMENT ON COLUMN notifications.closed_at IS 'Timestamp when task was closed';
