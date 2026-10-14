-- ==============================================================================
-- Migration: 20261009_production_seed_62_accounts.sql
-- Description:
--   Complete production seeding for all 62 CareerNexus Test Accounts
--   (50 Students, 10 Alumni, 1 Recruiter, 1 Admin)
--
-- Features:
--   1. Matches EXACT columns of hosted database (inspected from information_schema)
--   2. Injects auth.users with crypt(password, gen_salt('bf'))
--   3. Compatible with Supabase GoTrue v2 auth.identities
--   4. Confirms all emails (email_confirmed_at = NOW())
--   5. Temporarily disables triggers during execution to prevent admin downgrade/permission errors
--   6. Fully idempotent (can be safely run multiple times without duplicates or errors)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Grant execute on public.get_user_role to resolve RLS 42501 error
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_user_role'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon, authenticated, service_role;
    END IF;
END $$;

-- 2. Temporarily disable triggers that interfere with batch seeding
ALTER TABLE public.users DISABLE TRIGGER trg_protect_user_role_and_status;
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- 3. Dynamic helper for auth.identities compatibility with any Supabase GoTrue schema
CREATE OR REPLACE FUNCTION pg_temp.seed_auth_identity(p_uid UUID, p_email TEXT) RETURNS VOID AS $$
DECLARE
    has_provider_id boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'provider_id'
    ) INTO has_provider_id;

    DELETE FROM auth.identities WHERE user_id = p_uid;

    IF has_provider_id THEN
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            p_uid,
            jsonb_build_object('sub', p_uid::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
            'email',
            p_uid::text,
            NOW(),
            NOW(),
            NOW()
        );
    ELSE
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
        ) VALUES (
            p_uid::text,
            p_uid,
            jsonb_build_object('sub', p_uid::text, 'email', p_email, 'email_verified', true, 'phone_verified', false),
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Account 1: student001 (Aarav Sharma)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000001';
    v_sid UUID := '00000000-0000-0000-0011-000000000001';
    v_email TEXT := 'student001@careernexus.com';
    v_pwd TEXT := 'Student@001X';
    v_name TEXT := 'Aarav Sharma';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('1', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('1', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('1', 3, '0'),
        8.20,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 2: student002 (Diya Patel)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000002';
    v_sid UUID := '00000000-0000-0000-0011-000000000002';
    v_email TEXT := 'student002@careernexus.com';
    v_pwd TEXT := 'Student@002X';
    v_name TEXT := 'Diya Patel';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('2', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('2', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('2', 3, '0'),
        8.90,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 3: student003 (Rohan Verma)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000003';
    v_sid UUID := '00000000-0000-0000-0011-000000000003';
    v_email TEXT := 'student003@careernexus.com';
    v_pwd TEXT := 'Student@003X';
    v_name TEXT := 'Rohan Verma';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('3', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('3', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('3', 3, '0'),
        9.60,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 4: student004 (Ananya Sen)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000004';
    v_sid UUID := '00000000-0000-0000-0011-000000000004';
    v_email TEXT := 'student004@careernexus.com';
    v_pwd TEXT := 'Student@004X';
    v_name TEXT := 'Ananya Sen';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('4', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('4', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('4', 3, '0'),
        7.90,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 5: student005 (Kavya Reddy)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000005';
    v_sid UUID := '00000000-0000-0000-0011-000000000005';
    v_email TEXT := 'student005@careernexus.com';
    v_pwd TEXT := 'Student@005X';
    v_name TEXT := 'Kavya Reddy';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('5', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('5', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('5', 3, '0'),
        8.60,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 6: student006 (Aditya Iyer)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000006';
    v_sid UUID := '00000000-0000-0000-0011-000000000006';
    v_email TEXT := 'student006@careernexus.com';
    v_pwd TEXT := 'Student@006X';
    v_name TEXT := 'Aditya Iyer';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('6', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('6', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('6', 3, '0'),
        9.30,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 7: student007 (Ishaan Nair)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000007';
    v_sid UUID := '00000000-0000-0000-0011-000000000007';
    v_email TEXT := 'student007@careernexus.com';
    v_pwd TEXT := 'Student@007X';
    v_name TEXT := 'Ishaan Nair';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('7', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('7', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('7', 3, '0'),
        7.60,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 8: student008 (Sneha Mehta)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000008';
    v_sid UUID := '00000000-0000-0000-0011-000000000008';
    v_email TEXT := 'student008@careernexus.com';
    v_pwd TEXT := 'Student@008X';
    v_name TEXT := 'Sneha Mehta';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('8', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('8', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('8', 3, '0'),
        8.30,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 9: student009 (Arjun Chopra)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000009';
    v_sid UUID := '00000000-0000-0000-0011-000000000009';
    v_email TEXT := 'student009@careernexus.com';
    v_pwd TEXT := 'Student@009X';
    v_name TEXT := 'Arjun Chopra';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('9', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('9', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('9', 3, '0'),
        9.00,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 10: student010 (Meera Gupta)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000010';
    v_sid UUID := '00000000-0000-0000-0011-000000000010';
    v_email TEXT := 'student010@careernexus.com';
    v_pwd TEXT := 'Student@010X';
    v_name TEXT := 'Meera Gupta';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('10', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('10', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('10', 3, '0'),
        9.70,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 11: student011 (Dev Bose)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000011';
    v_sid UUID := '00000000-0000-0000-0011-000000000011';
    v_email TEXT := 'student011@careernexus.com';
    v_pwd TEXT := 'Student@011X';
    v_name TEXT := 'Dev Bose';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('11', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('11', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('11', 3, '0'),
        8.00,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 12: student012 (Pooja Deshmukh)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000012';
    v_sid UUID := '00000000-0000-0000-0011-000000000012';
    v_email TEXT := 'student012@careernexus.com';
    v_pwd TEXT := 'Student@012X';
    v_name TEXT := 'Pooja Deshmukh';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('12', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('12', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('12', 3, '0'),
        8.70,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 13: student013 (Rahul Kulkarni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000013';
    v_sid UUID := '00000000-0000-0000-0011-000000000013';
    v_email TEXT := 'student013@careernexus.com';
    v_pwd TEXT := 'Student@013X';
    v_name TEXT := 'Rahul Kulkarni';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('13', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('13', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('13', 3, '0'),
        9.40,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 14: student014 (Priya Malhotra)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000014';
    v_sid UUID := '00000000-0000-0000-0011-000000000014';
    v_email TEXT := 'student014@careernexus.com';
    v_pwd TEXT := 'Student@014X';
    v_name TEXT := 'Priya Malhotra';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('14', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('14', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('14', 3, '0'),
        7.70,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 15: student015 (Varun Joshi)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000015';
    v_sid UUID := '00000000-0000-0000-0011-000000000015';
    v_email TEXT := 'student015@careernexus.com';
    v_pwd TEXT := 'Student@015X';
    v_name TEXT := 'Varun Joshi';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('15', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('15', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('15', 3, '0'),
        8.40,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Selected'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 16: student016 (Neha Bhatia)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000016';
    v_sid UUID := '00000000-0000-0000-0011-000000000016';
    v_email TEXT := 'student016@careernexus.com';
    v_pwd TEXT := 'Student@016X';
    v_name TEXT := 'Neha Bhatia';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('16', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('16', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('16', 3, '0'),
        9.10,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 17: student017 (Siddharth Menon)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000017';
    v_sid UUID := '00000000-0000-0000-0011-000000000017';
    v_email TEXT := 'student017@careernexus.com';
    v_pwd TEXT := 'Student@017X';
    v_name TEXT := 'Siddharth Menon';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('17', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('17', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('17', 3, '0'),
        9.80,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 18: student018 (Ritu Pillai)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000018';
    v_sid UUID := '00000000-0000-0000-0011-000000000018';
    v_email TEXT := 'student018@careernexus.com';
    v_pwd TEXT := 'Student@018X';
    v_name TEXT := 'Ritu Pillai';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('18', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('18', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('18', 3, '0'),
        8.10,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 19: student019 (Karan Rao)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000019';
    v_sid UUID := '00000000-0000-0000-0011-000000000019';
    v_email TEXT := 'student019@careernexus.com';
    v_pwd TEXT := 'Student@019X';
    v_name TEXT := 'Karan Rao';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('19', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('19', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('19', 3, '0'),
        8.80,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 20: student020 (Tanvi Saxena)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000020';
    v_sid UUID := '00000000-0000-0000-0011-000000000020';
    v_email TEXT := 'student020@careernexus.com';
    v_pwd TEXT := 'Student@020X';
    v_name TEXT := 'Tanvi Saxena';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('20', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('20', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('20', 3, '0'),
        9.50,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 21: student021 (Nikhil Chauhan)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000021';
    v_sid UUID := '00000000-0000-0000-0011-000000000021';
    v_email TEXT := 'student021@careernexus.com';
    v_pwd TEXT := 'Student@021X';
    v_name TEXT := 'Nikhil Chauhan';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('21', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('21', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('21', 3, '0'),
        7.80,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 22: student022 (Simran Pandey)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000022';
    v_sid UUID := '00000000-0000-0000-0011-000000000022';
    v_email TEXT := 'student022@careernexus.com';
    v_pwd TEXT := 'Student@022X';
    v_name TEXT := 'Simran Pandey';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('22', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('22', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('22', 3, '0'),
        8.50,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 23: student023 (Akash Mishra)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000023';
    v_sid UUID := '00000000-0000-0000-0011-000000000023';
    v_email TEXT := 'student023@careernexus.com';
    v_pwd TEXT := 'Student@023X';
    v_name TEXT := 'Akash Mishra';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('23', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('23', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('23', 3, '0'),
        9.20,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 24: student024 (Shreya Trivedi)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000024';
    v_sid UUID := '00000000-0000-0000-0011-000000000024';
    v_email TEXT := 'student024@careernexus.com';
    v_pwd TEXT := 'Student@024X';
    v_name TEXT := 'Shreya Trivedi';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('24', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('24', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('24', 3, '0'),
        7.50,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 25: student025 (Manish Bhatt)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000025';
    v_sid UUID := '00000000-0000-0000-0011-000000000025';
    v_email TEXT := 'student025@careernexus.com';
    v_pwd TEXT := 'Student@025X';
    v_name TEXT := 'Manish Bhatt';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('25', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('25', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('25', 3, '0'),
        8.20,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 26: student026 (Tara Thakur)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000026';
    v_sid UUID := '00000000-0000-0000-0011-000000000026';
    v_email TEXT := 'student026@careernexus.com';
    v_pwd TEXT := 'Student@026X';
    v_name TEXT := 'Tara Thakur';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('26', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('26', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('26', 3, '0'),
        8.90,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 27: student027 (Vivek Gowda)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000027';
    v_sid UUID := '00000000-0000-0000-0011-000000000027';
    v_email TEXT := 'student027@careernexus.com';
    v_pwd TEXT := 'Student@027X';
    v_name TEXT := 'Vivek Gowda';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('27', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('27', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('27', 3, '0'),
        9.60,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 28: student028 (Nisha Shetty)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000028';
    v_sid UUID := '00000000-0000-0000-0011-000000000028';
    v_email TEXT := 'student028@careernexus.com';
    v_pwd TEXT := 'Student@028X';
    v_name TEXT := 'Nisha Shetty';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('28', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('28', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('28', 3, '0'),
        7.90,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 29: student029 (Rishi Hegde)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000029';
    v_sid UUID := '00000000-0000-0000-0011-000000000029';
    v_email TEXT := 'student029@careernexus.com';
    v_pwd TEXT := 'Student@029X';
    v_name TEXT := 'Rishi Hegde';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('29', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('29', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('29', 3, '0'),
        8.60,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 30: student030 (Kriti Nambiar)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000030';
    v_sid UUID := '00000000-0000-0000-0011-000000000030';
    v_email TEXT := 'student030@careernexus.com';
    v_pwd TEXT := 'Student@030X';
    v_name TEXT := 'Kriti Nambiar';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('30', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('30', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('30', 3, '0'),
        9.30,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 31: student031 (Harsh Das)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000031';
    v_sid UUID := '00000000-0000-0000-0011-000000000031';
    v_email TEXT := 'student031@careernexus.com';
    v_pwd TEXT := 'Student@031X';
    v_name TEXT := 'Harsh Das';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('31', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('31', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('31', 3, '0'),
        7.60,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 32: student032 (Anushka Roy)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000032';
    v_sid UUID := '00000000-0000-0000-0011-000000000032';
    v_email TEXT := 'student032@careernexus.com';
    v_pwd TEXT := 'Student@032X';
    v_name TEXT := 'Anushka Roy';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('32', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('32', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('32', 3, '0'),
        8.30,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 33: student033 (Gaurav Dutta)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000033';
    v_sid UUID := '00000000-0000-0000-0011-000000000033';
    v_email TEXT := 'student033@careernexus.com';
    v_pwd TEXT := 'Student@033X';
    v_name TEXT := 'Gaurav Dutta';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('33', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('33', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('33', 3, '0'),
        9.00,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 34: student034 (Aditi Banerjee)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000034';
    v_sid UUID := '00000000-0000-0000-0011-000000000034';
    v_email TEXT := 'student034@careernexus.com';
    v_pwd TEXT := 'Student@034X';
    v_name TEXT := 'Aditi Banerjee';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('34', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('34', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('34', 3, '0'),
        9.70,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 35: student035 (Pranav Chatterjee)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000035';
    v_sid UUID := '00000000-0000-0000-0011-000000000035';
    v_email TEXT := 'student035@careernexus.com';
    v_pwd TEXT := 'Student@035X';
    v_name TEXT := 'Pranav Chatterjee';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('35', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('35', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('35', 3, '0'),
        8.00,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'In Progress'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 36: student036 (Payal Mukherjee)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000036';
    v_sid UUID := '00000000-0000-0000-0011-000000000036';
    v_email TEXT := 'student036@careernexus.com';
    v_pwd TEXT := 'Student@036X';
    v_name TEXT := 'Payal Mukherjee';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('36', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('36', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('36', 3, '0'),
        8.70,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 37: student037 (Sameer Ghosh)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000037';
    v_sid UUID := '00000000-0000-0000-0011-000000000037';
    v_email TEXT := 'student037@careernexus.com';
    v_pwd TEXT := 'Student@037X';
    v_name TEXT := 'Sameer Ghosh';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('37', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('37', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('37', 3, '0'),
        9.40,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 38: student038 (Swati Biswas)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000038';
    v_sid UUID := '00000000-0000-0000-0011-000000000038';
    v_email TEXT := 'student038@careernexus.com';
    v_pwd TEXT := 'Student@038X';
    v_name TEXT := 'Swati Biswas';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('38', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('38', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('38', 3, '0'),
        7.70,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 39: student039 (Kunal Sarkar)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000039';
    v_sid UUID := '00000000-0000-0000-0011-000000000039';
    v_email TEXT := 'student039@careernexus.com';
    v_pwd TEXT := 'Student@039X';
    v_name TEXT := 'Kunal Sarkar';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('39', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('39', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('39', 3, '0'),
        8.40,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 40: student040 (Bhavna Chakraborty)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000040';
    v_sid UUID := '00000000-0000-0000-0011-000000000040';
    v_email TEXT := 'student040@careernexus.com';
    v_pwd TEXT := 'Student@040X';
    v_name TEXT := 'Bhavna Chakraborty';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('40', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('40', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('40', 3, '0'),
        9.10,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 41: student041 (Tarun Narang)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000041';
    v_sid UUID := '00000000-0000-0000-0011-000000000041';
    v_email TEXT := 'student041@careernexus.com';
    v_pwd TEXT := 'Student@041X';
    v_name TEXT := 'Tarun Narang';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('41', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('41', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('41', 3, '0'),
        9.80,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 42: student042 (Deepika Kohli)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000042';
    v_sid UUID := '00000000-0000-0000-0011-000000000042';
    v_email TEXT := 'student042@careernexus.com';
    v_pwd TEXT := 'Student@042X';
    v_name TEXT := 'Deepika Kohli';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('42', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('42', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('42', 3, '0'),
        8.10,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 43: student043 (Ayush Kapoor)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000043';
    v_sid UUID := '00000000-0000-0000-0011-000000000043';
    v_email TEXT := 'student043@careernexus.com';
    v_pwd TEXT := 'Student@043X';
    v_name TEXT := 'Ayush Kapoor';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('43', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('43', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('43', 3, '0'),
        8.80,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 44: student044 (Rhea Khanna)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000044';
    v_sid UUID := '00000000-0000-0000-0011-000000000044';
    v_email TEXT := 'student044@careernexus.com';
    v_pwd TEXT := 'Student@044X';
    v_name TEXT := 'Rhea Khanna';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('44', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('44', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('44', 3, '0'),
        9.50,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 45: student045 (Abhinav Bakshi)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000045';
    v_sid UUID := '00000000-0000-0000-0011-000000000045';
    v_email TEXT := 'student045@careernexus.com';
    v_pwd TEXT := 'Student@045X';
    v_name TEXT := 'Abhinav Bakshi';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('45', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('45', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('45', 3, '0'),
        7.80,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 46: student046 (Shalini Sethi)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000046';
    v_sid UUID := '00000000-0000-0000-0011-000000000046';
    v_email TEXT := 'student046@careernexus.com';
    v_pwd TEXT := 'Student@046X';
    v_name TEXT := 'Shalini Sethi';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('46', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('46', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('46', 3, '0'),
        8.50,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 47: student047 (Kartik Anand)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000047';
    v_sid UUID := '00000000-0000-0000-0011-000000000047';
    v_email TEXT := 'student047@careernexus.com';
    v_pwd TEXT := 'Student@047X';
    v_name TEXT := 'Kartik Anand';
    v_dept TEXT := 'Information Technology';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('47', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('47', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('47', 3, '0'),
        9.20,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 48: student048 (Sonia Ahluwalia)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000048';
    v_sid UUID := '00000000-0000-0000-0011-000000000048';
    v_email TEXT := 'student048@careernexus.com';
    v_pwd TEXT := 'Student@048X';
    v_name TEXT := 'Sonia Ahluwalia';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('48', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('48', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('48', 3, '0'),
        7.50,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 49: student049 (Yash Sarin)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000049';
    v_sid UUID := '00000000-0000-0000-0011-000000000049';
    v_email TEXT := 'student049@careernexus.com';
    v_pwd TEXT := 'Student@049X';
    v_name TEXT := 'Yash Sarin';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('49', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('49', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('49', 3, '0'),
        8.20,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 50: student050 (Shruti Trehan)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000050';
    v_sid UUID := '00000000-0000-0000-0011-000000000050';
    v_email TEXT := 'student050@careernexus.com';
    v_pwd TEXT := 'Student@050X';
    v_name TEXT := 'Shruti Trehan';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    -- Delete previous matching test account if present
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    -- Insert into auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'student'),
        false,
        NOW(),
        NOW()
    );

    -- Insert into auth.identities
    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users (Only real existing columns)
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('50', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'student'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.students (Only real existing columns)
    INSERT INTO public.students (
        id, user_id, full_name, email, profile_photo, phone, department, course, batch, graduation_year,
        roll_number, cgpa, tenth_percentage, twelfth_percentage, skills, preferred_domain,
        bio, placement_status, profile_completion, is_active, projects, certifications, custom_fields, created_at, updated_at
    ) VALUES (
        v_sid,
        v_uid,
        v_name,
        v_email,
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        '+91 98765 43' || LPAD('50', 3, '0'),
        v_dept,
        'B.Tech',
        '2023-2027',
        2027,
        '23CS' || LPAD('50', 3, '0'),
        8.90,
        88.5,
        86.0,
        ARRAY['Java', 'Data Structures', 'TypeScript', 'SQL']::TEXT[],
        'Software Development',
        'Final year student preparing for campus recruitment.',
        'Not Placed'::placement_status_type,
        85,
        TRUE,
        '[]'::jsonb,
        '[]'::jsonb,
        '{}'::jsonb,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        department = EXCLUDED.department,
        cgpa = EXCLUDED.cgpa,
        placement_status = EXCLUDED.placement_status,
        updated_at = NOW();
END $$;

-- Account 51: alumni001 (Tarun Narang @ Google)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000001';
    v_aid UUID := '00000000-0000-0000-0022-000000000001';
    v_email TEXT := 'alumni001@careernexus.com';
    v_pwd TEXT := 'Alumni@001X';
    v_name TEXT := 'Tarun Narang';
    v_comp TEXT := 'Google';
    v_desig TEXT := 'Senior Staff Software Engineer';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('1', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('1', 3, '0'),
        '{}'::jsonb,
        8,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 52: alumni002 (Deepika Kohli @ Microsoft)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000002';
    v_aid UUID := '00000000-0000-0000-0022-000000000002';
    v_email TEXT := 'alumni002@careernexus.com';
    v_pwd TEXT := 'Alumni@002X';
    v_name TEXT := 'Deepika Kohli';
    v_comp TEXT := 'Microsoft';
    v_desig TEXT := 'Principal Cloud Solution Architect';
    v_dept TEXT := 'Information Technology';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('2', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('2', 3, '0'),
        '{}'::jsonb,
        7,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 53: alumni003 (Ayush Kapoor @ Amazon)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000003';
    v_aid UUID := '00000000-0000-0000-0022-000000000003';
    v_email TEXT := 'alumni003@careernexus.com';
    v_pwd TEXT := 'Alumni@003X';
    v_name TEXT := 'Ayush Kapoor';
    v_comp TEXT := 'Amazon';
    v_desig TEXT := 'Senior Software Development Engineer (SDE III)';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('3', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('3', 3, '0'),
        '{}'::jsonb,
        6,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 54: alumni004 (Rhea Khanna @ Atlassian)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000004';
    v_aid UUID := '00000000-0000-0000-0022-000000000004';
    v_email TEXT := 'alumni004@careernexus.com';
    v_pwd TEXT := 'Alumni@004X';
    v_name TEXT := 'Rhea Khanna';
    v_comp TEXT := 'Atlassian';
    v_desig TEXT := 'Engineering Lead - Developer Platforms';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('4', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('4', 3, '0'),
        '{}'::jsonb,
        6,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 55: alumni005 (Abhinav Bakshi @ Adobe)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000005';
    v_aid UUID := '00000000-0000-0000-0022-000000000005';
    v_email TEXT := 'alumni005@careernexus.com';
    v_pwd TEXT := 'Alumni@005X';
    v_name TEXT := 'Abhinav Bakshi';
    v_comp TEXT := 'Adobe';
    v_desig TEXT := 'Senior Member of Technical Staff';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('5', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('5', 3, '0'),
        '{}'::jsonb,
        5,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 56: alumni006 (Shalini Sethi @ Cisco)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000006';
    v_aid UUID := '00000000-0000-0000-0022-000000000006';
    v_email TEXT := 'alumni006@careernexus.com';
    v_pwd TEXT := 'Alumni@006X';
    v_name TEXT := 'Shalini Sethi';
    v_comp TEXT := 'Cisco';
    v_desig TEXT := 'Senior Systems Network Architect';
    v_dept TEXT := 'Computer Science & Engineering';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('6', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('6', 3, '0'),
        '{}'::jsonb,
        6,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 57: alumni007 (Kartik Anand @ NVIDIA)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000007';
    v_aid UUID := '00000000-0000-0000-0022-000000000007';
    v_email TEXT := 'alumni007@careernexus.com';
    v_pwd TEXT := 'Alumni@007X';
    v_name TEXT := 'Kartik Anand';
    v_comp TEXT := 'NVIDIA';
    v_desig TEXT := 'Deep Learning & Acceleration Architect';
    v_dept TEXT := 'Information Technology';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('7', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('7', 3, '0'),
        '{}'::jsonb,
        5,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 58: alumni008 (Sonia Ahluwalia @ Goldman Sachs)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000008';
    v_aid UUID := '00000000-0000-0000-0022-000000000008';
    v_email TEXT := 'alumni008@careernexus.com';
    v_pwd TEXT := 'Alumni@008X';
    v_name TEXT := 'Sonia Ahluwalia';
    v_comp TEXT := 'Goldman Sachs';
    v_desig TEXT := 'Vice President - Quantitative Tech';
    v_dept TEXT := 'Artificial Intelligence & Data Science';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('8', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('8', 3, '0'),
        '{}'::jsonb,
        7,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 59: alumni009 (Yash Sarin @ Uber)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000009';
    v_aid UUID := '00000000-0000-0000-0022-000000000009';
    v_email TEXT := 'alumni009@careernexus.com';
    v_pwd TEXT := 'Alumni@009X';
    v_name TEXT := 'Yash Sarin';
    v_comp TEXT := 'Uber';
    v_desig TEXT := 'Senior Infrastructure Engineer';
    v_dept TEXT := 'Electronics & Communication Engineering';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('9', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('9', 3, '0'),
        '{}'::jsonb,
        5,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 60: alumni010 (Shruti Trehan @ Razorpay)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000010';
    v_aid UUID := '00000000-0000-0000-0022-000000000010';
    v_email TEXT := 'alumni010@careernexus.com';
    v_pwd TEXT := 'Alumni@010X';
    v_name TEXT := 'Shruti Trehan';
    v_comp TEXT := 'Razorpay';
    v_desig TEXT := 'Staff Payments Architect';
    v_dept TEXT := 'Electrical & Electronics Engineering';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'alumni'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    -- Insert into public.users
    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        '+91 98111 22' || LPAD('10', 3, '0'),
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'alumni'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Insert into public.alumni (Only real existing columns)
    INSERT INTO public.alumni (
        id, user_id, email, full_name, profile_photo, is_active, company, designation, department,
        graduation_year, skills, bio, linkedin_url, custom_fields, experience_years, created_at, updated_at
    ) VALUES (
        v_aid,
        v_uid,
        v_email,
        v_name,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        TRUE,
        v_comp,
        v_desig,
        v_dept,
        2020,
        ARRAY['System Design', 'Cloud Architecture', 'Distributed Systems']::TEXT[],
        'Passionate alumnus helping students transition smoothly into premier tech companies.',
        'https://linkedin.com/in/alumni' || LPAD('10', 3, '0'),
        '{}'::jsonb,
        6,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        experience_years = EXCLUDED.experience_years,
        updated_at = NOW();
END $$;

-- Account 61: recruiter001 (Vikram Singhania @ Google)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0003-000000000001';
    v_email TEXT := 'recruiter001@careernexus.com';
    v_pwd TEXT := 'Recruiter@001X';
    v_name TEXT := 'Vikram Singhania';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'recruiter'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'recruiter'::user_role,
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        '+91 99000 11001',
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'recruiter'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 62: admin001 (Dr. Anand Verma - Placement Director)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0004-000000000001';
    v_email TEXT := 'admin001@careernexus.com';
    v_pwd TEXT := 'Admin@001X';
    v_name TEXT := 'Dr. Anand Verma';
BEGIN
    DELETE FROM auth.users WHERE (email = v_email OR id = v_uid) AND email LIKE '%@careernexus.com';

    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'role', 'admin'),
        false,
        NOW(),
        NOW()
    );

    PERFORM pg_temp.seed_auth_identity(v_uid, v_email);

    INSERT INTO public.users (
        id, email, full_name, role, avatar_url, phone, status, is_active, activated_at, created_at, updated_at
    ) VALUES (
        v_uid,
        v_email,
        v_name,
        'admin'::user_role,
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        '+91 99000 99001',
        'active',
        TRUE,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'admin'::user_role,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- 4. Initial Notifications (Only real existing columns)
INSERT INTO public.notifications (id, user_id, created_at, title, message, type, is_read, link)
VALUES
(
    '00000000-0000-0000-0088-000000000001',
    '00000000-0000-0000-0001-000000000001',
    NOW() - INTERVAL '2 days',
    'Placement Offer Released',
    'Congratulations on your selection at Google SDE (₹42 LPA)!',
    'placement',
    FALSE,
    '/student/dashboard'
),
(
    '00000000-0000-0000-0088-000000000002',
    '00000000-0000-0000-0001-000000000002',
    NOW() - INTERVAL '1 day',
    'Assessment Scheduled',
    'Your technical assessment for Atlassian is scheduled for tomorrow.',
    'assessment',
    FALSE,
    '/student/dashboard'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Initial Messages (Only real existing columns)
INSERT INTO public.messages (
    id, created_at, receiver_id, sender_id, conversation_id, content,
    sender_name, sender_avatar, sender_role
) VALUES 
(
    '00000000-0000-0000-0099-000000000001',
    NOW() - INTERVAL '3 days',
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'conv-00000000-0000-0000-0001-000000000001_00000000-0000-0000-0002-000000000001',
    'Hello Tarun Sir! Excited to connect with you regarding system design at Google.',
    'Aarav Sharma',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'student'
),
(
    '00000000-0000-0000-0099-000000000002',
    NOW() - INTERVAL '2 days',
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'conv-00000000-0000-0000-0001-000000000001_00000000-0000-0000-0002-000000000001',
    'Hi Aarav! Happy to help. Focus on core distributed principles and concurrency.',
    'Tarun Narang',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'alumni'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Re-enable all triggers
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
ALTER TABLE public.users ENABLE TRIGGER trg_protect_user_role_and_status;

