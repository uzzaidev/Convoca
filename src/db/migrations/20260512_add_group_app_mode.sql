-- Add group app mode to support ranking and control-only groups.
BEGIN;

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS app_mode VARCHAR(20) NOT NULL DEFAULT 'ranking';

ALTER TABLE groups
DROP CONSTRAINT IF EXISTS groups_app_mode_check;

ALTER TABLE groups
ADD CONSTRAINT groups_app_mode_check
CHECK (app_mode IN ('ranking', 'control'));

COMMIT;
