-- =====================================================================
-- Complete Setup Script for New Supabase Project
-- Balasangham State Conference (ബാലസംഘം സംസ്ഥാന സമ്മേളനം)
-- 
-- Run this ONCE in your new Supabase Project's SQL Editor.
-- It creates all tables, RPCs, permissions, 14 districts, and default admin.
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'district', 'volunteer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delegate_status AS ENUM ('pending', 'checked_in', 'checked_out', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sos_status AS ENUM ('open', 'acknowledged', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES
-- 3.1 Districts Table (14 Kerala districts)
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL UNIQUE,
    name_ml TEXT NOT NULL UNIQUE
);

-- 3.2 Profiles Table (Staff profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'volunteer',
    district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
    preferred_lang TEXT NOT NULL DEFAULT 'ml',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 Houses Table (Host homes for accommodation)
CREATE TABLE IF NOT EXISTS houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    map_url TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    host_name TEXT NOT NULL,
    host_phone TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    gender_restriction TEXT DEFAULT 'any',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Delegates Table
CREATE TABLE IF NOT EXISTS delegates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    gender TEXT,
    emergency_name TEXT,
    emergency_phone TEXT,
    notes TEXT,
    house_id UUID REFERENCES houses(id) ON DELETE SET NULL,
    volunteer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status delegate_status NOT NULL DEFAULT 'pending',
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_en TEXT NOT NULL,
    title_ml TEXT NOT NULL,
    body_en TEXT NOT NULL,
    body_ml TEXT NOT NULL,
    target_district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.6 Location Pings Table (30-min temporary delegate GPS)
CREATE TABLE IF NOT EXISTS location_pings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- 3.7 Volunteer Location Pings (30-min volunteer GPS broadcast)
CREATE TABLE IF NOT EXISTS volunteer_location_pings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    volunteer_name TEXT NOT NULL,
    volunteer_phone TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- 3.8 App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- 4. SEED 14 KERALA DISTRICTS & HELPLINES
INSERT INTO districts (id, name_en, name_ml) VALUES
(1, 'Kasaragod', 'കാസർഗോഡ്'),
(2, 'Kannur', 'കണ്ണൂർ'),
(3, 'Wayanad', 'വയനാട്'),
(4, 'Kozhikode', 'കോഴിക്കോട്'),
(5, 'Malappuram', 'മലപ്പുറം'),
(6, 'Palakkad', 'പാലക്കാട്'),
(7, 'Thrissur', 'തൃശ്ശൂർ'),
(8, 'Ernakulam', 'എറണാകുളം'),
(9, 'Idukki', 'ഇടുക്കി'),
(10, 'Kottayam', 'കോട്ടയം'),
(11, 'Alappuzha', 'ആലപ്പുഴ'),
(12, 'Pathanamthitta', 'പത്തനംതിട്ട'),
(13, 'Kollam', 'കൊല്ലം'),
(14, 'Thiruvananthapuram', 'തിരുവനന്തപുരം')
ON CONFLICT (id) DO UPDATE SET name_en = EXCLUDED.name_en, name_ml = EXCLUDED.name_ml;

INSERT INTO app_settings (key, value) VALUES
('helplines', '[
    {"title_ml": "കൺട്രോൾ റൂം (24/7)", "title_en": "Control Room Desk", "phone": "04985201201"},
    {"title_ml": "മെഡിക്കൽ എയ്ഡ് & ആംബുലൻസ്", "title_en": "Medical Emergency", "phone": "9400011223"},
    {"title_ml": "റെസ്ക്യൂ & വളണ്ടിയർ വിങ്", "title_en": "Volunteer Dispatch", "phone": "9447123456"}
]'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 5. RPC FUNCTIONS
-- 5.1 Get My Stay Portal Data (Secure token-based lookup)
CREATE OR REPLACE FUNCTION get_my_stay(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_delegate RECORD;
    v_house JSONB := NULL;
    v_volunteer JSONB := NULL;
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
            'gender_restriction', h.gender_restriction,
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
                    'created_at', vlp.created_at,
                    'expires_at', vlp.expires_at
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 Share Location Ping (Delegate)
CREATE OR REPLACE FUNCTION share_location(p_token TEXT, p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_accuracy DOUBLE PRECISION DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_delegate_id UUID;
BEGIN
    SELECT id INTO v_delegate_id FROM delegates WHERE token = p_token;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
    END IF;

    INSERT INTO location_pings (delegate_id, lat, lng, accuracy, expires_at)
    VALUES (v_delegate_id, p_lat, p_lng, p_accuracy, NOW() + INTERVAL '30 minutes');

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.3 Share Volunteer Location Ping
CREATE OR REPLACE FUNCTION share_volunteer_location(
    p_name TEXT,
    p_phone TEXT,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_accuracy DOUBLE PRECISION DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_ping_id UUID;
BEGIN
    DELETE FROM volunteer_location_pings
    WHERE (volunteer_name = p_name OR volunteer_phone = p_phone)
       OR expires_at < NOW();

    INSERT INTO volunteer_location_pings (volunteer_name, volunteer_phone, lat, lng, accuracy, expires_at)
    VALUES (p_name, p_phone, p_lat, p_lng, p_accuracy, NOW() + INTERVAL '30 minutes')
    RETURNING id INTO v_ping_id;

    RETURN jsonb_build_object('success', true, 'ping_id', v_ping_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.4 Fast Bulk Import for Delegates
CREATE OR REPLACE FUNCTION import_delegates(p_delegates JSONB)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
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

-- 5.5 Fast Bulk Import for Houses
CREATE OR REPLACE FUNCTION import_houses(p_houses JSONB)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
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

-- 6. GRANT PERMISSIONS & RLS POLICIES
GRANT ALL ON TABLE districts TO authenticated, anon;
GRANT ALL ON TABLE profiles TO authenticated, anon;
GRANT ALL ON TABLE houses TO authenticated, anon;
GRANT ALL ON TABLE delegates TO authenticated, anon;
GRANT ALL ON TABLE announcements TO authenticated, anon;
GRANT ALL ON TABLE location_pings TO authenticated, anon;
GRANT ALL ON TABLE volunteer_location_pings TO authenticated, anon;
GRANT ALL ON TABLE app_settings TO authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

GRANT EXECUTE ON FUNCTION get_my_stay(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION share_location(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION share_volunteer_location(TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION import_delegates(JSONB) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION import_houses(JSONB) TO authenticated, anon;

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_location_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for delegates" ON delegates;
CREATE POLICY "Allow all for delegates" ON delegates FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for houses" ON houses;
CREATE POLICY "Allow all for houses" ON houses FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for announcements" ON announcements;
CREATE POLICY "Allow all for announcements" ON announcements FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for location_pings" ON location_pings;
CREATE POLICY "Allow all for location_pings" ON location_pings FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for volunteer_location_pings" ON volunteer_location_pings;
CREATE POLICY "Allow all for volunteer_location_pings" ON volunteer_location_pings FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for profiles" ON profiles;
CREATE POLICY "Allow all for profiles" ON profiles FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for districts" ON districts;
CREATE POLICY "Allow all for districts" ON districts FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for app_settings" ON app_settings;
CREATE POLICY "Allow all for app_settings" ON app_settings FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- 7. CREATE DEFAULT STATE ADMIN USER
-- Login: admin@balasangham.in / AdminSecurePass2026!
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@balasangham.in';
  v_password TEXT := 'AdminSecurePass2026!';
  v_full_name TEXT := 'സംസ്ഥാന അഡ്മിൻ (State Admin)';
  v_phone TEXT := '+91 94471 23456';
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW(),
        raw_user_meta_data = jsonb_build_object('full_name', v_full_name)
    WHERE id = v_user_id;
  ELSE
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', v_full_name),
      NOW(),
      NOW(),
      'authenticated',
      'authenticated'
    );
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (v_user_id, v_full_name, v_phone, 'admin')
  ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', 
        full_name = EXCLUDED.full_name;
END $$;
