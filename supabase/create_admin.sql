-- =====================================================================
-- Helper Script: Create State Admin User in Supabase
-- Run this in Supabase SQL Editor
-- =====================================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'admin@balasangham.in';             -- Change to your desired admin email
  v_password TEXT := 'AdminSecurePass2026!';           -- Change to your desired password
  v_full_name TEXT := 'സംസ്ഥാന അഡ്മിൻ (State Admin)';
  v_phone TEXT := '+91 94471 23456';
BEGIN
  -- 1. Create or update user in auth.users
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
  )
  ON CONFLICT (email) DO UPDATE 
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
  RETURNING id INTO v_user_id;

  -- 2. Create or promote profile in public.profiles with role = 'admin'
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (v_user_id, v_full_name, v_phone, 'admin')
  ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', 
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone;

  RAISE NOTICE 'Admin user created successfully! Email: %, Role: admin', v_email;
END $$;
