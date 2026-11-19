-- =====================================================================
-- Fix Table Permissions & Add Admin Import RPC for Delegates & Houses
-- Run this in Supabase SQL Editor
-- =====================================================================

-- 1. Grant table privileges to authenticated users (RLS policies will govern access)
GRANT ALL ON TABLE districts TO authenticated;
GRANT ALL ON TABLE houses TO authenticated;
GRANT ALL ON TABLE delegates TO authenticated;
GRANT ALL ON TABLE location_pings TO authenticated;
GRANT ALL ON TABLE announcements TO authenticated;

-- Ensure sequences are usable
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. Fast, Secure RPC for Admin Delegate Import (bypasses column locks, enforces admin role)
CREATE OR REPLACE FUNCTION import_delegates(p_delegates JSONB)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Verify the caller is an admin
    IF auth_role() != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Only state admins can import delegates.';
    END IF;

    INSERT INTO delegates (
        token, full_name, phone, district_id, gender,
        emergency_name, emergency_phone, notes, status
    )
    SELECT 
        COALESCE(NULLIF(elem->>'token', ''), 'del-' || substr(md5(random()::text), 1, 8) || '-' || (ROW_NUMBER() OVER())),
        COALESCE(NULLIF(elem->>'full_name', ''), 'Unnamed'),
        NULLIF(elem->>'phone', ''),
        COALESCE((elem->>'district_id')::INTEGER, 2),
        COALESCE(NULLIF(elem->>'gender', ''), 'boy'),
        NULLIF(elem->>'emergency_name', ''),
        NULLIF(elem->>'emergency_phone', ''),
        NULLIF(elem->>'notes', ''),
        COALESCE((elem->>'status')::delegate_status, 'pending')
    FROM jsonb_array_elements(p_delegates) AS elem
    ON CONFLICT (token) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        district_id = EXCLUDED.district_id,
        gender = EXCLUDED.gender,
        emergency_name = EXCLUDED.emergency_name,
        emergency_phone = EXCLUDED.emergency_phone,
        notes = EXCLUDED.notes;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fast, Secure RPC for Admin House Import
CREATE OR REPLACE FUNCTION import_houses(p_houses JSONB)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF auth_role() != 'admin' THEN
        RAISE EXCEPTION 'Access denied: Only state admins can import houses.';
    END IF;

    INSERT INTO houses (
        name, address, map_url, lat, lng, host_name, host_phone, capacity, gender_restriction, notes
    )
    SELECT 
        COALESCE(NULLIF(elem->>'name', ''), 'Unnamed House'),
        COALESCE(NULLIF(elem->>'address', ''), ''),
        NULLIF(elem->>'map_url', ''),
        (elem->>'lat')::DOUBLE PRECISION,
        (elem->>'lng')::DOUBLE PRECISION,
        COALESCE(NULLIF(elem->>'host_name', ''), 'Host'),
        COALESCE(NULLIF(elem->>'host_phone', ''), ''),
        COALESCE((elem->>'capacity')::INTEGER, 4),
        COALESCE(NULLIF(elem->>'gender_restriction', ''), 'any'),
        NULLIF(elem->>'notes', '')
    FROM jsonb_array_elements(p_houses) AS elem;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permissions on the RPC functions
GRANT EXECUTE ON FUNCTION import_delegates(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION import_houses(JSONB) TO authenticated;
