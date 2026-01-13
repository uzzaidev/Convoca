-- Migration: Add MVP tiebreaker system
-- Description: Creates tables and logic for handling MVP vote ties with runoff voting or admin decision
-- Date: 2026-01-13

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: mvp_tiebreakers
-- Stores tiebreaker rounds when MVP votes result in a tie
CREATE TABLE IF NOT EXISTS mvp_tiebreakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'voting', 'completed', 'admin_decided')),
  tied_user_ids UUID[] NOT NULL,
  winner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE(event_id, round)
);

COMMENT ON TABLE mvp_tiebreakers IS 'Manages MVP voting tiebreakers for events';
COMMENT ON COLUMN mvp_tiebreakers.round IS 'Tiebreaker round number (starts at 1)';
COMMENT ON COLUMN mvp_tiebreakers.status IS 'pending: detected but not started | voting: active voting | completed: resolved via votes | admin_decided: admin chose winner';
COMMENT ON COLUMN mvp_tiebreakers.tied_user_ids IS 'Array of user IDs that are tied';
COMMENT ON COLUMN mvp_tiebreakers.winner_user_id IS 'Final MVP winner after tiebreaker';
COMMENT ON COLUMN mvp_tiebreakers.decided_by IS 'User ID of admin who decided (if admin_decided)';

-- Table: mvp_tiebreaker_votes
-- Stores votes cast during tiebreaker rounds
CREATE TABLE IF NOT EXISTS mvp_tiebreaker_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tiebreaker_id UUID NOT NULL REFERENCES mvp_tiebreakers(id) ON DELETE CASCADE,
  voter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voted_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tiebreaker_id, voter_user_id)
);

COMMENT ON TABLE mvp_tiebreaker_votes IS 'Votes cast during MVP tiebreaker rounds';
COMMENT ON COLUMN mvp_tiebreaker_votes.tiebreaker_id IS 'Reference to the tiebreaker round';
COMMENT ON COLUMN mvp_tiebreaker_votes.voter_user_id IS 'User casting the vote';
COMMENT ON COLUMN mvp_tiebreaker_votes.voted_user_id IS 'User receiving the vote (must be in tied_user_ids)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mvp_tiebreakers_event ON mvp_tiebreakers(event_id);
CREATE INDEX IF NOT EXISTS idx_mvp_tiebreakers_status ON mvp_tiebreakers(status);
CREATE INDEX IF NOT EXISTS idx_mvp_tiebreaker_votes_tiebreaker ON mvp_tiebreaker_votes(tiebreaker_id);
CREATE INDEX IF NOT EXISTS idx_mvp_tiebreaker_votes_voter ON mvp_tiebreaker_votes(voter_user_id);
