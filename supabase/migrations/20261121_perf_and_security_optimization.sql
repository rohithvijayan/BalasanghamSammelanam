-- =====================================================================
-- Migration: 20261121_perf_and_security_optimization.sql
-- Goal: Fix unindexed foreign keys, prevent search_path hijacking on SECURITY DEFINER RPCs,
--       wrap RLS auth functions in subselects, clean up expired pings, and harden permissions.
-- =====================================================================

-- =====================================================================
-- UP MIGRATION
-- =====================================================================

-- 1. INDEXES: Missing Foreign Key & Filter Indexes
-- (In Supabase SQL editor, CREATE INDEX IF NOT EXISTS is safe to execute)
CREATE INDEX IF NOT EXISTS idx_delegates_house_id ON public.delegates (house_id);
CREATE INDEX IF NOT EXISTS idx_delegates_volunteer_id ON public.delegates (volunteer_id);
CREATE INDEX IF NOT EXISTS idx_delegates_district_id ON public.delegates (district_id);
CREATE INDEX IF NOT EXISTS idx_delegates_status ON public.delegates (status);
CREATE INDEX IF NOT EXISTS idx_delegates_created_at_desc ON public.delegates (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delegates_district_gender_status ON public.delegates (district_id, gender, status);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_delegate_id ON public.sos_alerts (delegate_id);
CREATE INDEX IF NOT EXISTS idx_location_pings_delegate_id ON public.location_pings (delegate_id);
CREATE INDEX IF NOT EXISTS idx_location_pings_expires_at ON public.location_pings (expires_at);

CREATE INDEX IF NOT EXISTS idx_announcements_target_district ON public.announcements (target_district_id, pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_houses_name ON public.houses (name);

-- 2. SECURE & OPTIMIZE RLS HELPER FUNCTIONS
-- Setting search_path prevents search-path hijacking.
-- STABLE ensures execution is cached per query statement where possible.
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT role FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.auth_district()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT district_id FROM public.profiles WHERE id = (SELECT auth.uid());
$$;

-- 3. SECURE SECURITY DEFINER RPCS WITH FIXED search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.phone, ''),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'admin'::public.user_role)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_stay(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_delegate RECORD;
    v_house JSONB := NULL;
    v_volunteer JSONB := NULL;
    v_announcements JSONB := '[]'::jsonb;
    v_helpline JSONB := '[]'::jsonb;
BEGIN
    -- Verify delegate exists
    SELECT d.id, d.token, d.full_name, d.gender, d.status, d.house_id, d.volunteer_id, d.district_id,
           dist.name_en AS dist_en, dist.name_ml AS dist_ml
    INTO v_delegate
    FROM public.delegates d
    JOIN public.districts dist ON d.district_id = dist.id
    WHERE d.token = p_token;

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
        FROM public.houses
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
                FROM public.volunteer_location_pings vlp
                WHERE (vlp.volunteer_name = p.full_name OR vlp.volunteer_phone = p.phone)
                  AND vlp.expires_at > NOW()
                ORDER BY vlp.created_at DESC
                LIMIT 1
            )
        )
        INTO v_volunteer
        FROM public.profiles p
        WHERE p.id = v_delegate.volunteer_id;
    END IF;

    -- Fetch targeted announcements (indexed lookup)
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
    FROM public.announcements
    WHERE target_district_id IS NULL OR target_district_id = v_delegate.district_id;

    -- Fetch helpline settings
    SELECT value INTO v_helpline FROM public.app_settings WHERE key = 'helplines';

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
        'helplines', COALESCE(v_helpline, '[]'::jsonb)
    );
END;
$$;

-- 4. HOUSE BATCH UPSERT RPC (Eliminates N+1 HTTP update requests)
CREATE OR REPLACE FUNCTION public.bulk_upsert_houses(p_houses JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    INSERT INTO public.houses (
        id, name, address, map_url, lat, lng, host_name, host_phone, capacity, gender_restriction, notes
    )
    SELECT 
        COALESCE((elem->>'id')::UUID, gen_random_uuid()),
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
    FROM jsonb_array_elements(p_houses) AS elem
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        map_url = EXCLUDED.map_url,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        host_name = EXCLUDED.host_name,
        host_phone = EXCLUDED.host_phone,
        capacity = EXCLUDED.capacity,
        gender_restriction = EXCLUDED.gender_restriction,
        notes = EXCLUDED.notes;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_upsert_houses(JSONB) TO authenticated, anon;

-- 5. AUTOMATIC RETENTION PURGE JOB (Prevents Database Bloat on Free Tier)
CREATE OR REPLACE FUNCTION public.purge_expired_location_pings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_deleted INTEGER := 0;
BEGIN
    DELETE FROM public.location_pings WHERE expires_at < NOW();
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    DELETE FROM public.volunteer_location_pings WHERE expires_at < NOW();
    
    RETURN v_deleted;
END;
$$;

-- =====================================================================
-- DOWN / ROLLBACK MIGRATION
-- =====================================================================
/*
DROP INDEX IF EXISTS public.idx_delegates_house_id;
DROP INDEX IF EXISTS public.idx_delegates_volunteer_id;
DROP INDEX IF EXISTS public.idx_delegates_district_id;
DROP INDEX IF EXISTS public.idx_delegates_status;
DROP INDEX IF EXISTS public.idx_delegates_created_at_desc;
DROP INDEX IF EXISTS public.idx_delegates_district_gender_status;
DROP INDEX IF EXISTS public.idx_sos_alerts_delegate_id;
DROP INDEX IF EXISTS public.idx_location_pings_delegate_id;
DROP INDEX IF EXISTS public.idx_location_pings_expires_at;
DROP INDEX IF EXISTS public.idx_announcements_target_district;
DROP INDEX IF EXISTS public.idx_houses_name;

DROP FUNCTION IF EXISTS public.bulk_upsert_houses(JSONB);
DROP FUNCTION IF EXISTS public.purge_expired_location_pings();
*/
