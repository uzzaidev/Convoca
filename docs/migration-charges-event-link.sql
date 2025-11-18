-- Migration: Add event_id column to charges table
-- Purpose: Link charges to the event/partida they were created from
-- Date: 2024-11-18

-- Add event_id column to charges table (nullable - existing charges won't have an event)
ALTER TABLE charges 
ADD COLUMN IF NOT EXISTS event_id UUID;

-- Add foreign key constraint
ALTER TABLE charges
ADD CONSTRAINT fk_charges_event
FOREIGN KEY (event_id) 
REFERENCES events(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_charges_event_id ON charges(event_id);

-- Comment to explain the column
COMMENT ON COLUMN charges.event_id IS 'Optional reference to the event this charge was created from';
