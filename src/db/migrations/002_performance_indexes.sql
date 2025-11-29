-- Migration 002: Performance Indexes and Optimizations
-- Date: 2025-01-29
-- Description: Add indexes to frequently queried columns to improve performance

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Events: Improve queries filtering by group and date
CREATE INDEX IF NOT EXISTS idx_events_group_starts
ON events(group_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_events_status_starts
ON events(status, starts_at);

-- Group Members: Speed up membership checks
CREATE INDEX IF NOT EXISTS idx_group_members_group_user
ON group_members(group_id, user_id);

CREATE INDEX IF NOT EXISTS idx_group_members_user_role
ON group_members(user_id, role);

-- Event Attendance: Optimize RSVP queries
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_user
ON event_attendance(event_id, user_id);

CREATE INDEX IF NOT EXISTS idx_event_attendance_event_status
ON event_attendance(event_id, status);

-- Charges: Improve payment queries
CREATE INDEX IF NOT EXISTS idx_charges_group_status
ON charges(group_id, status);

CREATE INDEX IF NOT EXISTS idx_charges_user_status
ON charges(user_id, status);

CREATE INDEX IF NOT EXISTS idx_charges_due_date
ON charges(due_date) WHERE due_date IS NOT NULL;

-- Teams: Optimize team queries
CREATE INDEX IF NOT EXISTS idx_teams_event
ON teams(event_id);

CREATE INDEX IF NOT EXISTS idx_team_members_team
ON team_members(team_id);

CREATE INDEX IF NOT EXISTS idx_team_members_user
ON team_members(user_id);

-- Event Actions: Speed up statistics and scoreboard
CREATE INDEX IF NOT EXISTS idx_event_actions_event_type
ON event_actions(event_id, action_type);

CREATE INDEX IF NOT EXISTS idx_event_actions_subject_user
ON event_actions(subject_user_id, action_type);

CREATE INDEX IF NOT EXISTS idx_event_actions_team
ON event_actions(team_id, action_type);

-- Votes: Optimize voting queries
CREATE INDEX IF NOT EXISTS idx_votes_event_voter
ON votes(event_id, voter_user_id);

CREATE INDEX IF NOT EXISTS idx_votes_event_voted
ON votes(event_id, voted_user_id);

-- Invites: Speed up invite lookups
CREATE INDEX IF NOT EXISTS idx_invites_code
ON invites(code) WHERE expires_at IS NULL OR expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_invites_group
ON invites(group_id);

-- Users: Email lookup optimization (if not already indexed)
CREATE INDEX IF NOT EXISTS idx_users_email_lower
ON users(LOWER(email));

-- ============================================================================
-- QUERY OPTIMIZATION COMMENTS
-- ============================================================================

COMMENT ON INDEX idx_events_group_starts IS
'Optimizes: SELECT * FROM events WHERE group_id = ? AND starts_at > NOW()';

COMMENT ON INDEX idx_group_members_group_user IS
'Optimizes: Membership checks and role validation';

COMMENT ON INDEX idx_event_attendance_event_status IS
'Optimizes: Counting confirmed players, waitlist management';

COMMENT ON INDEX idx_charges_group_status IS
'Optimizes: Filtering charges by status in payment pages';

COMMENT ON INDEX idx_event_actions_event_type IS
'Optimizes: Scoreboard queries and statistics calculation';

-- ============================================================================
-- STATISTICS UPDATE
-- ============================================================================

-- Update table statistics for query planner
ANALYZE events;
ANALYZE group_members;
ANALYZE event_attendance;
ANALYZE charges;
ANALYZE event_actions;
ANALYZE teams;
ANALYZE votes;
