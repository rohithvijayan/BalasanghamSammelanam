-- =====================================================================
-- Migration: Fix Foreign Key Constraint Violation (23503) for Volunteers
-- =====================================================================
-- Root Cause:
-- The original delegates table had:
--   volunteer_id UUID REFERENCES profiles(id) ON DELETE SET NULL
-- When assigning volunteers imported into the 'volunteers' table,
-- Postgres threw error 23503 ("Key is not present in table profiles").
--
-- Solution:
-- Drop the legacy profiles-only constraint so that delegates.volunteer_id
-- can reference records in the volunteers table.
-- =====================================================================

-- 1. Drop the restrictive foreign key constraint to profiles
ALTER TABLE delegates DROP CONSTRAINT IF EXISTS delegates_volunteer_id_fkey;

-- 2. Ensure the volunteers table exists and is readable
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    unit TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ensure delegates.volunteer_id column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delegates' AND column_name = 'volunteer_id'
    ) THEN 
        ALTER TABLE delegates ADD COLUMN volunteer_id UUID;
    END IF;
END $$;

-- 4. Enable index for fast queries by volunteer_id
CREATE INDEX IF NOT EXISTS idx_delegates_volunteer_id ON delegates(volunteer_id);

-- 5. Ensure authenticated staff can view and manage volunteers table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE volunteers TO authenticated;
GRANT SELECT ON TABLE volunteers TO anon;

DROP POLICY IF EXISTS "Volunteers viewable by authenticated and anon" ON volunteers;
CREATE POLICY "Volunteers viewable by authenticated and anon"
    ON volunteers FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Admins and staff manage volunteers" ON volunteers;
CREATE POLICY "Admins and staff manage volunteers"
    ON volunteers FOR ALL
    TO authenticated
    USING (auth_role() IN ('admin', 'district'))
    WITH CHECK (auth_role() IN ('admin', 'district'));
