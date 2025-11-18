-- Rollback Migration: Remove candidate_status column from candidates table
-- Date: 2025-11-03
-- Description: Rollback - Remove candidate_status column if needed

-- Start transaction
BEGIN;

-- Drop the index first
DROP INDEX IF EXISTS idx_candidates_status;

-- Remove the column
ALTER TABLE candidates DROP COLUMN IF EXISTS candidate_status;

-- Commit transaction
COMMIT;

-- Verify the column is removed
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'candidates' AND column_name = 'candidate_status';
-- Should return no rows




