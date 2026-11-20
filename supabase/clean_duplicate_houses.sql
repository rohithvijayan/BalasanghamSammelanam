-- Balasangham Sammelanam: Clean Duplicate Houses Script
-- Run this in your Supabase SQL Editor if duplicate houses exist in the houses table.
-- It keeps the canonical (oldest / first created) house record for each unique house name
-- and updates any delegate allocations so no foreign key dependencies are broken.

BEGIN;

-- 1. Create temporary mapping of duplicate house IDs to canonical house ID
CREATE TEMP TABLE IF NOT EXISTS temp_house_dedup AS
SELECT 
    h.id AS old_id,
    c.canonical_id
FROM houses h
JOIN (
    SELECT DISTINCT ON (LOWER(TRIM(name)))
        id AS canonical_id,
        LOWER(TRIM(name)) AS norm_name
    FROM houses
    ORDER BY LOWER(TRIM(name)), created_at ASC
) c ON LOWER(TRIM(h.name)) = c.norm_name
WHERE h.id != c.canonical_id;

-- 2. Remap any delegate allocations pointing to duplicate IDs
UPDATE delegates d
SET house_id = m.canonical_id
FROM temp_house_dedup m
WHERE d.house_id = m.old_id;

-- 3. Delete duplicate house rows
DELETE FROM houses
WHERE id IN (SELECT old_id FROM temp_house_dedup);

-- 4. Clean up temp table
DROP TABLE IF EXISTS temp_house_dedup;

-- 5. Return remaining count
SELECT COUNT(*) AS total_unique_houses FROM houses;

COMMIT;
