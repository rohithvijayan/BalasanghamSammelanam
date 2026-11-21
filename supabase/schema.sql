-- =====================================================================
-- Conference Stay Tracker - Supabase Postgres Schema & Security Spec
-- Version: 1.0 (Balasangham Sammelanam)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    phone TEXT NOT NULL,
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
    gender_restriction TEXT DEFAULT 'any', -- 'boys', 'girls', 'any'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 Delegates Table (500-700 attendees)
CREATE TABLE IF NOT EXISTS delegates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE, -- Unguessable URL token >= 12 chars
    full_name TEXT NOT NULL,
    phone TEXT,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    gender TEXT, -- 'boy', 'girl', 'other'
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

-- 3.6 SOS Alerts Table
CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    status sos_status NOT NULL DEFAULT 'open',
    acknowledged_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 Location Requests Table (Volunteer asking delegate for location)
CREATE TABLE IF NOT EXISTS location_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fulfilled_at TIMESTAMPTZ
);

-- 3.8 Location Pings Table (Consent-based, 30m TTL)
CREATE TABLE IF NOT EXISTS location_pings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegate_id UUID NOT NULL REFERENCES delegates(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    accuracy DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes')
);

-- 3.8b Volunteer Location Pings (Temporary 30-min pings for volunteers to guide delegates & admins)
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

CREATE INDEX IF NOT EXISTS idx_vol_location_pings_expires ON volunteer_location_pings(expires_at);
CREATE INDEX IF NOT EXISTS idx_vol_location_pings_name ON volunteer_location_pings(volunteer_name);

-- 3.9 Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- 4. HELPER FUNCTIONS FOR RLS

CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_district()
RETURNS INTEGER AS $$
    SELECT district_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE delegates ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 5.1 Districts Policy
CREATE POLICY "Districts viewable by authenticated staff"
    ON districts FOR SELECT
    TO authenticated
    USING (true);

-- 5.2 Profiles Policy
CREATE POLICY "Admins full access on profiles"
    ON profiles FOR ALL
    TO authenticated
    USING (auth_role() = 'admin');

CREATE POLICY "Users read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Users insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        role = (SELECT role FROM profiles WHERE id = auth.uid()) AND
        district_id IS NOT DISTINCT FROM (SELECT district_id FROM profiles WHERE id = auth.uid())
    );

-- Auto-provision profile trigger when user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.phone, ''),
    -- SECURITY FIX: New users default to volunteer, never auto-escalate to admin
    COALESCE((new.raw_app_meta_data->>'role')::user_role, 'volunteer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5.3 Houses Policy
CREATE POLICY "Admins full access on houses"
    ON houses FOR ALL
    TO authenticated
    USING (auth_role() = 'admin');

CREATE POLICY "District users read houses of own delegates"
    ON houses FOR SELECT
    TO authenticated
    USING (
        auth_role() = 'district' AND
        id IN (SELECT house_id FROM delegates WHERE district_id = auth_district() AND house_id IS NOT NULL)
    );

CREATE POLICY "Volunteers read houses of assigned delegates"
    ON houses FOR SELECT
    TO authenticated
    USING (
        auth_role() = 'volunteer' AND
        id IN (SELECT house_id FROM delegates WHERE volunteer_id = auth.uid() AND house_id IS NOT NULL)
    );

-- 5.4 Delegates Policy
CREATE POLICY "Admins full access on delegates"
    ON delegates FOR ALL
    TO authenticated
    USING (auth_role() = 'admin');

CREATE POLICY "District users select own district delegates"
    ON delegates FOR SELECT
    TO authenticated
    USING (
        auth_role() = 'district' AND
        district_id = auth_district()
    );

CREATE POLICY "District users update status of own district delegates"
    ON delegates FOR UPDATE
    TO authenticated
    USING (
        auth_role() = 'district' AND
        district_id = auth_district()
    )
    WITH CHECK (
        auth_role() = 'district' AND
        district_id = auth_district()
    );

CREATE POLICY "Volunteers select assigned delegates"
    ON delegates FOR SELECT
    TO authenticated
    USING (
        auth_role() = 'volunteer' AND
        volunteer_id = auth.uid()
    );

CREATE POLICY "Volunteers update status of assigned delegates"
    ON delegates FOR UPDATE
    TO authenticated
    USING (
        auth_role() = 'volunteer' AND
        volunteer_id = auth.uid()
    )
    WITH CHECK (
        auth_role() = 'volunteer' AND
        volunteer_id = auth.uid()
    );

-- Column privilege restrictions (FR-ASN-5)
REVOKE UPDATE ON delegates FROM authenticated;
GRANT UPDATE (status, checked_in_at, checked_out_at) ON delegates TO authenticated;
-- Admins retain full update rights via service role or admin RPC

-- 5.5 Location Pings Policy (30-min auto-expire enforcement)
CREATE POLICY "Location pings viewable by admin and assigned volunteer"
    ON location_pings FOR SELECT
    TO authenticated
    USING (
        expires_at > NOW() AND (
            auth_role() = 'admin' OR
            delegate_id IN (SELECT id FROM delegates WHERE volunteer_id = auth.uid())
        )
    );

-- 5.6 Announcements Policy
CREATE POLICY "Announcements viewable by staff"
    ON announcements FOR SELECT
    TO authenticated
    USING (
        target_district_id IS NULL OR
        target_district_id = auth_district() OR
        auth_role() = 'admin'
    );

CREATE POLICY "Admins manage announcements"
    ON announcements FOR ALL
    TO authenticated
    USING (auth_role() = 'admin');

-- 6. DELEGATE ANONYMOUS SECURE DEFINER RPCS (No anon table access)

-- 6.1 Get My Stay Portal Data
CREATE OR REPLACE FUNCTION get_my_stay(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_delegate RECORD;
    v_house JSONB := NULL;
    v_volunteer JSONB := NULL;
    v_announcements JSONB;
    v_helpline JSONB;
    v_clean_phone TEXT;
BEGIN
    v_clean_phone := regexp_replace(p_token, '[^0-9]', '', 'g');

    -- Verify delegate exists: match by token, ID, or phone number
    SELECT d.*, dist.name_en AS dist_en, dist.name_ml AS dist_ml
    INTO v_delegate
    FROM delegates d
    JOIN districts dist ON d.district_id = dist.id
    WHERE d.token = p_token
       OR d.id::text = p_token
       OR (
           length(v_clean_phone) >= 7 AND (
               regexp_replace(d.phone, '[^0-9]', '', 'g') = v_clean_phone
               OR (
                   length(regexp_replace(d.phone, '[^0-9]', '', 'g')) >= 10
                   AND length(v_clean_phone) >= 10
                   AND right(regexp_replace(d.phone, '[^0-9]', '', 'g'), 10) = right(v_clean_phone, 10)
               )
           )
       )
    ORDER BY (d.token = p_token) DESC, d.created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
    END IF;

    -- Fetch house if assigned
    IF v_delegate.house_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', id,
            'name', name,
            'address', address,
            'map_url', map_url,
            'lat', lat,
            'lng', lng,
            'host_name', host_name,
            'host_phone', host_phone,
            'capacity', capacity
        )
        INTO v_house
        FROM houses
        WHERE id = v_delegate.house_id;
    END IF;

    -- Fetch volunteer if assigned
    IF v_delegate.volunteer_id IS NOT NULL THEN
        SELECT jsonb_build_object(
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
                WHERE (vlp.volunteer_name = p.full_name OR vlp.volunteer_phone = p.phone)
                  AND vlp.expires_at > NOW()
                ORDER BY vlp.created_at DESC
                LIMIT 1
            )
        )
        INTO v_volunteer
        FROM profiles p
        WHERE p.id = v_delegate.volunteer_id;
    END IF;

    -- Fetch targeted announcements
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

    -- Fetch helpline settings
    SELECT value INTO v_helpline FROM app_settings WHERE key = 'helplines';

    RETURN jsonb_build_object(
        'success', true,
        'delegate', jsonb_build_object(
            'id', v_delegate.id,
            'full_name', v_delegate.full_name,
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

-- 6.2 Trigger SOS Alert
CREATE OR REPLACE FUNCTION trigger_sos(p_token TEXT, p_lat DOUBLE PRECISION DEFAULT NULL, p_lng DOUBLE PRECISION DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_delegate_id UUID;
    v_alert_id UUID;
BEGIN
    SELECT id INTO v_delegate_id FROM delegates WHERE token = p_token;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
    END IF;

    INSERT INTO sos_alerts (delegate_id, lat, lng, status)
    VALUES (v_delegate_id, p_lat, p_lng, 'open')
    RETURNING id INTO v_alert_id;

    RETURN jsonb_build_object('success', true, 'alert_id', v_alert_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Share Location Ping (30 min auto-expiry)
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

-- 6.4 Share Volunteer Live Location (30 min auto-expiry)
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

    RETURN jsonb_build_object(
        'success', true,
        'ping_id', v_ping_id,
        'expires_in', '30 minutes'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.5 Auto-sync House Volunteer In-Charge to Occupants on House Assignment & Removal
CREATE OR REPLACE FUNCTION trg_sync_delegate_house_volunteer()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.house_id IS NOT NULL) OR (TG_OP = 'UPDATE' AND NEW.house_id IS DISTINCT FROM OLD.house_id) THEN
        IF NEW.house_id IS NULL THEN
            -- On removal of delegate from a house, empty the volunteer field
            NEW.volunteer_id := NULL;
        ELSE
            -- When assigned to a house, overwrite with house's volunteer_id
            SELECT volunteer_id INTO NEW.volunteer_id
            FROM public.houses
            WHERE id = NEW.house_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_delegate_house_volunteer_sync
BEFORE INSERT OR UPDATE OF house_id ON public.delegates
FOR EACH ROW
EXECUTE FUNCTION trg_sync_delegate_house_volunteer();

-- 6.6 Auto-sync Delegates when House Volunteer In-Charge is Updated (Atomic Cascade)
CREATE OR REPLACE FUNCTION trg_sync_house_volunteer_to_delegates()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND NEW.volunteer_id IS DISTINCT FROM OLD.volunteer_id) THEN
        UPDATE public.delegates
        SET volunteer_id = NEW.volunteer_id
        WHERE house_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_house_volunteer_to_delegates_sync ON public.houses;
CREATE TRIGGER trg_house_volunteer_to_delegates_sync
AFTER UPDATE OF volunteer_id ON public.houses
FOR EACH ROW
EXECUTE FUNCTION trg_sync_house_volunteer_to_delegates();
