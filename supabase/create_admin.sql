-- =====================================================================
-- Helper Script: Create or Promote State Admin User in Supabase
-- Compatible with all Supabase Postgres versions (No ON CONFLICT email)
-- Run this in Supabase SQL Editor
-- =====================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'admin@balasangham.in';       -- 👈 Change to your admin email
  v_password TEXT := 'AdminSecurePass2026!';     -- 👈 Change to your admin password
  v_full_name TEXT := 'സംസ്ഥാന അഡ്മിൻ (State Admin)';
  v_phone TEXT := '+91 94471 23456';
BEGIN
  -- 1. Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    -- Update existing user's password and confirmation status
    UPDATE auth.users
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW(),
        raw_user_meta_data = jsonb_build_object('full_name', v_full_name)
    WHERE id = v_user_id;
  ELSE
    -- Generate new UUID and insert new auth user
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

  -- 2. Insert or update entry in public.profiles with role = 'admin'
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (v_user_id, v_full_name, v_phone, 'admin')
  ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', 
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;

  RAISE NOTICE 'Success! Admin user ready: % (ID: %)', v_email, v_user_id;
END $$;
