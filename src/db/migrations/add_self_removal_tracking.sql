-- Migration: Add self-removal tracking to event_attendance
-- Description: Adds timestamp column to track when users remove themselves from events
-- Date: 2026-01-13

-- Add removed_by_self_at column
ALTER TABLE event_attendance
ADD COLUMN removed_by_self_at TIMESTAMP;

-- Add comment to explain the column
COMMENT ON COLUMN event_attendance.removed_by_self_at
IS 'Timestamp quando usuário mudou status de yes para no (auto-remoção)';

-- Add index for admin queries filtering by self-removal
CREATE INDEX IF NOT EXISTS idx_event_attendance_removed_by_self
ON event_attendance(removed_by_self_at)
WHERE removed_by_self_at IS NOT NULL;
