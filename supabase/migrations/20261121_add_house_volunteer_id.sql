-- =====================================================================
-- Migration: Add volunteer_id to houses table for House In-Charge Auto-Inheritance
-- =====================================================================

-- 1. Add volunteer_id column to houses table if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'houses' AND column_name = 'volunteer_id'
    ) THEN 
        ALTER TABLE houses ADD COLUMN volunteer_id UUID;
    END IF;
END $$;

-- 2. Create index on houses(volunteer_id) for fast lookups
CREATE INDEX IF NOT EXISTS idx_houses_volunteer_id ON houses(volunteer_id);

-- 3. Ensure delegates.volunteer_id column exists and drop any legacy profiles-only FK
ALTER TABLE delegates DROP CONSTRAINT IF EXISTS delegates_volunteer_id_fkey;
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'delegates' AND column_name = 'volunteer_id'
    ) THEN 
        ALTER TABLE delegates ADD COLUMN volunteer_id UUID;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_delegates_volunteer_id ON delegates(volunteer_id);
