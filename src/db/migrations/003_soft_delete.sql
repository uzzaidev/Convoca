-- Migration 003: Soft Delete Support (OPTIONAL - Run when ready)
-- Date: 2025-01-29
-- Description: Add soft delete capability to prevent data loss

-- ============================================================================
-- ADD DELETED_AT COLUMNS
-- ============================================================================

-- Groups: Allow soft delete of groups
ALTER TABLE groups
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

COMMENT ON COLUMN groups.deleted_at IS
'Timestamp when group was soft deleted. NULL means active.';

-- Group Members: Track when members were removed
ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

COMMENT ON COLUMN group_members.deleted_at IS
'Timestamp when member was removed from group. NULL means active.';

-- Charges: Allow soft delete of charges
ALTER TABLE charges
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

COMMENT ON COLUMN charges.deleted_at IS
'Timestamp when charge was deleted. NULL means active.';

-- Invites: Track deleted invites
ALTER TABLE invites
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;

COMMENT ON COLUMN invites.deleted_at IS
'Timestamp when invite was deleted. NULL means active.';

-- ============================================================================
-- INDEXES FOR SOFT DELETE
-- ============================================================================

-- Partial indexes to only index active records
CREATE INDEX IF NOT EXISTS idx_groups_active
ON groups(id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_group_members_active
ON group_members(group_id, user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_charges_active
ON charges(group_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_invites_active
ON invites(code) WHERE deleted_at IS NULL;

-- ============================================================================
-- HELPER VIEWS (OPTIONAL)
-- ============================================================================

-- View of active groups only
CREATE OR REPLACE VIEW active_groups AS
SELECT * FROM groups WHERE deleted_at IS NULL;

COMMENT ON VIEW active_groups IS
'Returns only active (non-deleted) groups';

-- View of active members only
CREATE OR REPLACE VIEW active_group_members AS
SELECT * FROM group_members WHERE deleted_at IS NULL;

COMMENT ON VIEW active_group_members IS
'Returns only active (non-deleted) group members';

-- ============================================================================
-- USAGE NOTES
-- ============================================================================

-- After running this migration, update your queries:
--
-- OLD: SELECT * FROM groups WHERE id = ?
-- NEW: SELECT * FROM groups WHERE id = ? AND deleted_at IS NULL
--
-- For soft delete:
-- OLD: DELETE FROM groups WHERE id = ?
-- NEW: UPDATE groups SET deleted_at = NOW() WHERE id = ?
--
-- To restore:
-- UPDATE groups SET deleted_at = NULL WHERE id = ?
--
-- To permanently delete (after 30 days):
-- DELETE FROM groups WHERE deleted_at < NOW() - INTERVAL '30 days'
