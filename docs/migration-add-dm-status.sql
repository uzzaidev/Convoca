-- Migration: Add 'dm' (Departamento Médico) status to event_attendance
-- Date: 2025-10-28
-- Description: Adds a new status option 'dm' for players who are injured/unavailable

-- Step 1: Drop the existing constraint
ALTER TABLE event_attendance 
DROP CONSTRAINT IF EXISTS event_attendance_status_check;

-- Step 2: Add the new constraint with 'dm' status
ALTER TABLE event_attendance 
ADD CONSTRAINT event_attendance_status_check 
CHECK (status IN ('yes', 'no', 'waitlist', 'dm'));

-- Verification query - check that the constraint was added successfully
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'event_attendance'::regclass 
AND conname = 'event_attendance_status_check';
