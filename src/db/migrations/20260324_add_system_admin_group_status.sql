-- Add global system admin role and operational status to groups

ALTER TABLE users
ADD COLUMN IF NOT EXISTS system_role VARCHAR(20) NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_system_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_system_role_check
      CHECK (system_role IN ('user', 'system_admin'));
  END IF;
END $$;

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'groups_status_check'
  ) THEN
    ALTER TABLE groups
      ADD CONSTRAINT groups_status_check
      CHECK (status IN ('pending', 'active', 'inactive', 'rejected'));
  END IF;
END $$;

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS status_reason TEXT;

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS status_updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

UPDATE users
SET system_role = 'user'
WHERE system_role IS NULL;

UPDATE groups
SET
  status = 'active',
  status_reason = NULL,
  status_updated_at = COALESCE(status_updated_at, updated_at, created_at, NOW()),
  status_updated_by = COALESCE(status_updated_by, created_by)
WHERE status IS NULL
   OR status = 'pending';

UPDATE users
SET system_role = 'system_admin'
WHERE lower(email) = lower('luisfboff@hotmail.com');

CREATE INDEX IF NOT EXISTS idx_users_system_role ON users(system_role);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);
