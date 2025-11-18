-- Migration: Update employee table to make fields nullable
-- Date: 2025-11-04
-- Description: Make name, email, and employee_id nullable; remove unique constraint from email

-- Start transaction
BEGIN;

-- Step 1: Drop the unique constraint on email
-- First, find the constraint name (it might be 'employee_email_key' or similar)
ALTER TABLE employee DROP CONSTRAINT IF EXISTS employee_email_key;

-- Step 2: Make name nullable (if it wasn't already)
ALTER TABLE employee ALTER COLUMN name DROP NOT NULL;

-- Step 3: Make email nullable
ALTER TABLE employee ALTER COLUMN email DROP NOT NULL;

-- Step 4: Make employee_id nullable (if it wasn't already)
ALTER TABLE employee ALTER COLUMN employee_id DROP NOT NULL;

-- Note: employee_id unique constraint (employee_employee_id_key) is kept
-- PostgreSQL allows multiple NULL values in unique constraints

-- Commit transaction
COMMIT;

-- Verify the changes
SELECT 
    column_name, 
    is_nullable, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'employee' 
    AND column_name IN ('name', 'email', 'employee_id')
ORDER BY column_name;

-- Verify constraints
SELECT
    conname as constraint_name,
    contype as constraint_type,
    a.attname as column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.conrelid = 'employee'::regclass
    AND a.attname IN ('email', 'employee_id')
ORDER BY conname;

