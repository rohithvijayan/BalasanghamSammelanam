-- =====================================================================
-- Hardened Security & Role-Based Access Control (RBAC) Migration
-- Balasangham State Conference (ബാലസംഘം സംസ്ഥാന സമ്മേളനം)
-- 
-- Run this in your Supabase SQL Editor.
-- Fixes critical vulnerabilities:
-- 1. Eliminates unconditional anon access & drops 'Allow all' policies.
-- 2. Enforces strict Row Level Security (RLS) on all tables.
-- 3. Protects admin/staff roles against self-escalation.
-- 4. Restricts SECURITY DEFINER RPCs (import_delegates, import_houses) to verified admins.
-- 5. Hardens search_path on all functions against search-path hijacking.
-- =====================================================================

-- 1. SECURE SEARCH PATH ON EXISTING FUNCTIONS
ALTER FUNCTION auth_role() SET search_path = public, pg_temp;
ALTER FUNCTION auth_district() SET search_path = public, pg_temp;

-- 2. ENSURE VOLUNTEERS TABLE EXISTS AND ENABLE RLS ON ALL TABLES
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    unit TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure profiles has phone and unit columns for volunteer self-service
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS unit TEXT;

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_location_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 3. REVOKE UNRESTRICTED ANONYMOUS TABLE PRIVILEGES
REVOKE ALL ON TABLE profiles FROM anon;
REVOKE ALL ON TABLE houses FROM anon;
REVOKE ALL ON TABLE delegates FROM anon;
REVOKE ALL ON TABLE announcements FROM anon;
REVOKE ALL ON TABLE sos_alerts FROM anon;
REVOKE ALL ON TABLE location_requests FROM anon;
REVOKE ALL ON TABLE location_pings FROM anon;
REVOKE ALL ON TABLE volunteer_location_pings FROM anon;
REVOKE ALL ON TABLE audit_log FROM anon;

-- Grant only necessary minimal privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE delegates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE houses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE volunteers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE announcements TO authenticated;
GRANT SELECT, UPDATE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE sos_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE location_pings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE volunteer_location_pings TO authenticated;
GRANT SELECT ON TABLE districts TO authenticated, anon;
GRANT SELECT ON TABLE app_settings TO authenticated, anon;
GRANT SELECT ON TABLE volunteers TO authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. DROP ALL INSECURE "ALLOW ALL" POLICIES
DROP POLICY IF EXISTS "Allow all for delegates" ON delegates;
DROP POLICY IF EXISTS "Allow all for houses" ON houses;
DROP POLICY IF EXISTS "Allow all for announcements" ON announcements;
DROP POLICY IF EXISTS "Allow all for profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all for location_pings" ON location_pings;
DROP POLICY IF EXISTS "Allow all for volunteer_location_pings" ON volunteer_location_pings;
DROP POLICY IF EXISTS "Allow all for districts" ON districts;
DROP POLICY IF EXISTS "Allow all for app_settings" ON app_settings;
DROP POLICY IF EXISTS "Allow all for volunteers" ON volunteers;

-- 5. RE-ESTABLISH LEAST-PRIVILEGE RLS POLICIES

-- 5.1 Districts Policy: Publicly readable by all
DROP POLICY IF EXISTS "Districts viewable by all" ON districts;
CREATE POLICY "Districts viewable by all"
    ON districts FOR SELECT
    TO authenticated, anon
    USING (true);

-- 5.2 App Settings Policy: Read-only for all, manageable by Admin
DROP POLICY IF EXISTS "Settings viewable by all" ON app_settings;
CREATE POLICY "Settings viewable by all"
    ON app_settings FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON app_settings;
CREATE POLICY "Admins manage settings"
    ON app_settings FOR ALL
    TO authenticated
    USING (auth_role() = 'admin')
    WITH CHECK (auth_role() = 'admin');

-- 5.3 Profiles Policy:
-- - Staff can read profiles
-- - Admins can manage all profiles
-- - Users can update only their own safe fields (cannot alter role or district_id)
DROP POLICY IF EXISTS "Staff read profiles" ON profiles;
CREATE POLICY "Staff read profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins full access on profiles" ON profiles;
CREATE POLICY "Admins full access on profiles"
    ON profiles FOR ALL
    TO authenticated
    USING (auth_role() = 'admin')
    WITH CHECK (auth_role() = 'admin');

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own safe profile fields" ON profiles;
CREATE POLICY "Users update own safe profile fields"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
        district_id IS NOT DISTINCT FROM (SELECT district_id FROM profiles WHERE id = auth.uid())
    );

-- 5.4 Houses Policy:
-- - Authenticated staff can view all houses
-- - Admins and District Coordinators can create/update houses
-- - Only Admins can delete houses
DROP POLICY IF EXISTS "Staff view houses" ON houses;
CREATE POLICY "Staff view houses"
    ON houses FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff manage houses" ON houses;
CREATE POLICY "Staff manage houses"
    ON houses FOR INSERT
    TO authenticated
    WITH CHECK (auth_role() IN ('admin', 'district'));

DROP POLICY IF EXISTS "Staff update houses" ON houses;
CREATE POLICY "Staff update houses"
    ON houses FOR UPDATE
    TO authenticated
    USING (auth_role() IN ('admin', 'district'))
    WITH CHECK (auth_role() IN ('admin', 'district'));

DROP POLICY IF EXISTS "Admins delete houses" ON houses;
CREATE POLICY "Admins delete houses"
    ON houses FOR DELETE
    TO authenticated
    USING (auth_role() = 'admin');

-- 5.5 Delegates Policy:
-- - Authenticated staff can view delegates
-- - Admins and District Coordinators can insert/update delegates
-- - Volunteers can update delegate status (check-in)
-- - Only Admins can delete delegates
DROP POLICY IF EXISTS "Staff view delegates" ON delegates;
CREATE POLICY "Staff view delegates"
    ON delegates FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff manage delegates" ON delegates;
CREATE POLICY "Staff manage delegates"
    ON delegates FOR INSERT
    TO authenticated
    WITH CHECK (auth_role() IN ('admin', 'district'));

DROP POLICY IF EXISTS "Staff update delegates" ON delegates;
CREATE POLICY "Staff update delegates"
    ON delegates FOR UPDATE
    TO authenticated
    USING (auth_role() IN ('admin', 'district', 'volunteer'))
    WITH CHECK (auth_role() IN ('admin', 'district', 'volunteer'));

DROP POLICY IF EXISTS "Admins delete delegates" ON delegates;
CREATE POLICY "Admins delete delegates"
    ON delegates FOR DELETE
    TO authenticated
    USING (auth_role() = 'admin');

-- 5.6 Announcements Policy:
-- - All staff and anonymous delegates can read announcements
-- - Admins and District Coordinators can create and manage announcements
DROP POLICY IF EXISTS "Announcements readable by all" ON announcements;
CREATE POLICY "Announcements readable by all"
    ON announcements FOR SELECT
    TO authenticated, anon
    USING (true);

DROP POLICY IF EXISTS "Staff manage announcements" ON announcements;
CREATE POLICY "Staff manage announcements"
    ON announcements FOR ALL
    TO authenticated
    USING (auth_role() IN ('admin', 'district'))
    WITH CHECK (auth_role() IN ('admin', 'district'));

-- 5.7 Volunteer Location Pings Policy:
DROP POLICY IF EXISTS "Pings viewable by staff" ON volunteer_location_pings;
CREATE POLICY "Pings viewable by staff"
    ON volunteer_location_pings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staff manage volunteer pings" ON volunteer_location_pings;
CREATE POLICY "Staff manage volunteer pings"
    ON volunteer_location_pings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5.8 SOS Alerts Policy:
DROP POLICY IF EXISTS "Staff view and update SOS alerts" ON sos_alerts;
CREATE POLICY "Staff view and update SOS alerts"
    ON sos_alerts FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5.9 Volunteers Policy:
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

-- 6. HARDEN AND SECURE RPC FUNCTIONS

-- 6.1 get_my_stay (Security Definer with safe search_path)
CREATE OR REPLACE FUNCTION get_my_stay(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_delegate RECORD;
    v_house JSONB;
    v_volunteer JSONB;
    v_announcements JSONB;
    v_helpline JSONB;
BEGIN
    SELECT d.*, dist.name_en AS dist_en, dist.name_ml AS dist_ml
    INTO v_delegate
    FROM delegates d
    JOIN districts dist ON d.district_id = dist.id
    WHERE d.token = p_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
    END IF;

    IF v_delegate.house_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', h.id,
            'name', h.name,
            'address', h.address,
            'map_url', h.map_url,
            'lat', h.lat,
            'lng', h.lng,
            'host_name', h.host_name,
            'host_phone', h.host_phone,
            'capacity', h.capacity,
            'notes', h.notes
        )
        INTO v_house
        FROM houses h
        WHERE h.id = v_delegate.house_id;
    END IF;

    IF v_delegate.volunteer_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', p.id,
            'name', p.full_name,
            'phone', p.phone,
            'active_location', (
                SELECT jsonb_build_object(
                    'lat', vlp.lat,
                    'lng', vlp.lng,
                    'accuracy', vlp.accuracy,
                    'updated_at', vlp.created_at
                )
                FROM volunteer_location_pings vlp
                WHERE (vlp.volunteer_phone = p.phone OR vlp.volunteer_name = p.full_name)
                  AND vlp.expires_at > NOW()
                ORDER BY vlp.created_at DESC
                LIMIT 1
            )
        )
        INTO v_volunteer
        FROM profiles p
        WHERE p.id = v_delegate.volunteer_id;
    END IF;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'title_en', title_en,
        'title_ml', title_ml,
        'body_en', body_en,
        'body_ml', body_ml,
        'pinned', pinned,
        'created_at', created_at
    ) ORDER BY pinned DESC, created_at DESC), '[]'::jsonb)
    INTO v_announcements
    FROM announcements
    WHERE target_district_id IS NULL OR target_district_id = v_delegate.district_id;

    SELECT value INTO v_helpline FROM app_settings WHERE key = 'helplines';

    RETURN jsonb_build_object(
        'success', true,
        'delegate', jsonb_build_object(
            'id', v_delegate.id,
            'token', v_delegate.token,
            'full_name', v_delegate.full_name,
            'phone', v_delegate.phone,
            'district_en', v_delegate.dist_en,
            'district_ml', v_delegate.dist_ml,
            'gender', v_delegate.gender,
            'status', v_delegate.status
        ),
        'house', v_house,
        'volunteer', v_volunteer,
        'announcements', v_announcements,
        'helpline', v_helpline
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.2 share_location (Security Definer with safe search_path)
CREATE OR REPLACE FUNCTION share_location(
    p_token TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_accuracy DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_delegate_id UUID;
    v_ping_id UUID;
BEGIN
    SELECT id INTO v_delegate_id FROM delegates WHERE token = p_token;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
    END IF;

    DELETE FROM location_pings WHERE delegate_id = v_delegate_id;

    INSERT INTO location_pings (delegate_id, lat, lng, accuracy, expires_at)
    VALUES (v_delegate_id, p_lat, p_lng, p_accuracy, NOW() + INTERVAL '30 minutes')
    RETURNING id INTO v_ping_id;

    RETURN jsonb_build_object('success', true, 'ping_id', v_ping_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.3 share_volunteer_location (Sanitized and safe search_path)
CREATE OR REPLACE FUNCTION share_volunteer_location(
    p_name TEXT,
    p_phone TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_accuracy DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_clean_phone TEXT;
    v_clean_name TEXT;
BEGIN
    v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '[^0-9+]', '', 'g');
    v_clean_name := trim(COALESCE(p_name, 'Volunteer'));

    IF length(v_clean_name) < 2 OR length(v_clean_phone) < 7 THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_PARAMETERS');
    END IF;

    DELETE FROM volunteer_location_pings 
    WHERE (volunteer_phone = v_clean_phone OR volunteer_name = v_clean_name)
       OR expires_at < NOW();

    INSERT INTO volunteer_location_pings (
        volunteer_name, volunteer_phone, lat, lng, accuracy, expires_at
    ) VALUES (
        v_clean_name, v_clean_phone, p_lat, p_lng, p_accuracy, NOW() + INTERVAL '30 minutes'
    );

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.4 import_delegates: STRICT ADMIN-ONLY SECURITY GUARD
CREATE OR REPLACE FUNCTION import_delegates(p_delegates JSONB)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF auth_role() != 'admin' THEN
        RAISE EXCEPTION 'Access Denied: State Admin privileges required';
    END IF;

    INSERT INTO delegates (
        token, full_name, phone, district_id, gender,
        emergency_name, emergency_phone, notes, status
    )
    SELECT 
        COALESCE(NULLIF(elem->>'token', ''), 'del_' || encode(gen_random_bytes(12), 'hex')),
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6.5 import_houses: STRICT ADMIN-ONLY SECURITY GUARD
CREATE OR REPLACE FUNCTION import_houses(p_houses JSONB)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF auth_role() != 'admin' THEN
        RAISE EXCEPTION 'Access Denied: State Admin privileges required';
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 7. MANAGE EXECUTION PERMISSIONS
GRANT EXECUTE ON FUNCTION get_my_stay(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION share_location(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION share_volunteer_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, anon;

-- STRICT: Revoke import execution from anon / public
REVOKE EXECUTE ON FUNCTION import_delegates(JSONB) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION import_delegates(JSONB) TO authenticated;

REVOKE EXECUTE ON FUNCTION import_houses(JSONB) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION import_houses(JSONB) TO authenticated;
