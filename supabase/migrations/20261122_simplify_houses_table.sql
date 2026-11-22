-- =====================================================================
-- Migration: Simplify houses schema
-- Keeps only name, address, host_name, host_phone, capacity, gender_restriction, volunteer_id
-- Removes map_url, lat, lng, and notes from houses
-- =====================================================================

-- 1. DROP UNUSED COLUMNS FROM houses TABLE
ALTER TABLE houses DROP COLUMN IF EXISTS map_url;
ALTER TABLE houses DROP COLUMN IF EXISTS lat;
ALTER TABLE houses DROP COLUMN IF EXISTS lng;
ALTER TABLE houses DROP COLUMN IF EXISTS notes;

-- 2. UPDATE import_houses FUNCTION
CREATE OR REPLACE FUNCTION import_houses(p_houses JSONB)
RETURNS JSONB AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    IF auth_role() != 'admin' THEN
        RAISE EXCEPTION 'Access Denied: State Admin privileges required';
    END IF;

    INSERT INTO houses (
        name, address, host_name, host_phone, capacity, gender_restriction
    )
    SELECT 
        COALESCE(NULLIF(elem->>'name', ''), 'Unnamed House'),
        COALESCE(NULLIF(elem->>'address', ''), ''),
        COALESCE(NULLIF(elem->>'host_name', ''), 'Host'),
        COALESCE(NULLIF(elem->>'host_phone', ''), ''),
        COALESCE((elem->>'capacity')::INTEGER, 4),
        COALESCE(NULLIF(elem->>'gender_restriction', ''), 'any')
    FROM jsonb_array_elements(p_houses) AS elem;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION import_houses(JSONB) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION import_houses(JSONB) TO authenticated;

-- 3. UPDATE get_my_stay FUNCTION
CREATE OR REPLACE FUNCTION get_my_stay(p_token TEXT)
RETURNS JSONB AS $$
DECLARE
    v_delegate RECORD;
    v_house JSONB := NULL;
    v_volunteer JSONB := NULL;
    v_announcements JSONB := '[]'::jsonb;
    v_helpline JSONB := '[]'::jsonb;
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

    -- Fetch house safely (only when assigned)
    IF v_delegate.house_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', h.id,
            'name', h.name,
            'address', h.address,
            'host_name', h.host_name,
            'host_phone', h.host_phone,
            'capacity', h.capacity,
            'gender_restriction', h.gender_restriction
        )
        INTO v_house
        FROM houses h
        WHERE h.id = v_delegate.house_id;
    END IF;

    -- Fetch volunteer safely (only when assigned)
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

    -- Fetch announcements safely
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

    -- Fetch helpline settings safely
    SELECT COALESCE(value, '[]'::jsonb) INTO v_helpline FROM app_settings WHERE key = 'helplines';

    -- Return full payload
    RETURN jsonb_build_object(
        'success', true,
        'delegate', jsonb_build_object(
            'id', v_delegate.id,
            'token', v_delegate.token,
            'full_name', v_delegate.full_name,
            'phone', v_delegate.phone,
            'district_id', v_delegate.district_id,
            'district_en', v_delegate.dist_en,
            'district_ml', v_delegate.dist_ml,
            'gender', v_delegate.gender,
            'status', v_delegate.status,
            'checked_in_at', v_delegate.checked_in_at
        ),
        'house', v_house,
        'volunteer', v_volunteer,
        'announcements', COALESCE(v_announcements, '[]'::jsonb),
        'helplines', COALESCE(v_helpline, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION get_my_stay(TEXT) TO authenticated, anon;
