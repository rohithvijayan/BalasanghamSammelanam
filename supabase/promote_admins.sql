-- =====================================================================
-- Promote Users to State Admin
-- Run this in your Supabase SQL Editor
-- =====================================================================

DO $$
DECLARE
  emails TEXT[] := ARRAY['rohithvij20@gmail.com', 'admingbalasangham@gmail.com'];
  target_email TEXT;
  v_user_id UUID;
BEGIN
  FOREACH target_email IN ARRAY emails
  LOOP
    -- Find user in Supabase auth table
    SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email);

    IF v_user_id IS NOT NULL THEN
      -- 1. Update auth metadata
      UPDATE auth.users
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
          raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
      WHERE id = v_user_id;

      -- 2. Insert or update entry in public.profiles with role = 'admin'
      INSERT INTO public.profiles (id, full_name, phone, role)
      VALUES (v_user_id, split_part(target_email, '@', 1), '', 'admin')
      ON CONFLICT (id) DO UPDATE
        SET role = 'admin';

      RAISE NOTICE 'SUCCESS: Promoted % (ID: %) to Admin.', target_email, v_user_id;
    ELSE
      RAISE WARNING 'User % NOT FOUND in auth.users. Please make sure user is created in Authentication tab.', target_email;
    END IF;
  END LOOP;
END $$;

-- Verify both users are now admins:
SELECT p.id, u.email, p.full_name, p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN ('rohithvij20@gmail.com', 'admingbalasangham@gmail.com');
