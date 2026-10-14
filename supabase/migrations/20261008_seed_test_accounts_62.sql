-- ==============================================================================
-- Migration: 20261008_seed_test_accounts_62.sql
-- Description:
--   Complete production seeding for all 62 CareerNexus Test Accounts
--   (50 Students, 10 Alumni, 1 Recruiter, 1 Admin)
--   - Uses standard bcrypt password hashing (crypt(pwd, gen_salt('bf')))
--   - Sets up auth.users and matching public.users profiles
--   - Provisions distinct role-specific database data for students, alumni, recruiter, admin
--   - Applies Row-Level Security (RLS) constraints
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure required tables exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'alumni', 'recruiter', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    department TEXT DEFAULT '',
    company TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 2. SEED auth.users and public.users (62 Accounts)
-- ==============================================================================

-- Account 1: student001 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000001';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student001@careernexus.com',
            crypt('Student@001X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student001', 'full_name', 'Aarav Sharma', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student001',
        'student001@careernexus.com',
        'Aarav Sharma',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741775?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 2: student002 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000002';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student002@careernexus.com',
            crypt('Student@002X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student002', 'full_name', 'Diya Patel', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student002',
        'student002@careernexus.com',
        'Diya Patel',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741776?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 3: student003 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000003';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student003@careernexus.com',
            crypt('Student@003X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student003', 'full_name', 'Rohan Verma', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student003',
        'student003@careernexus.com',
        'Rohan Verma',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741777?w=150&auto=format&fit=crop&q=80',
        'Artificial Intelligence & Data Science',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 4: student004 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000004';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student004@careernexus.com',
            crypt('Student@004X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student004', 'full_name', 'Ananya Sen', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student004',
        'student004@careernexus.com',
        'Ananya Sen',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741778?w=150&auto=format&fit=crop&q=80',
        'Electronics & Communication',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 5: student005 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000005';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student005@careernexus.com',
            crypt('Student@005X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student005', 'full_name', 'Kavya Reddy', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student005',
        'student005@careernexus.com',
        'Kavya Reddy',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741779?w=150&auto=format&fit=crop&q=80',
        'Electrical & Electronics Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 6: student006 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000006';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student006@careernexus.com',
            crypt('Student@006X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student006', 'full_name', 'Aditya Iyer', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student006',
        'student006@careernexus.com',
        'Aditya Iyer',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741780?w=150&auto=format&fit=crop&q=80',
        'Mechanical Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 7: student007 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000007';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student007@careernexus.com',
            crypt('Student@007X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student007', 'full_name', 'Ishaan Nair', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student007',
        'student007@careernexus.com',
        'Ishaan Nair',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741781?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 8: student008 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000008';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student008@careernexus.com',
            crypt('Student@008X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student008', 'full_name', 'Sneha Mehta', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student008',
        'student008@careernexus.com',
        'Sneha Mehta',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741782?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 9: student009 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000009';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student009@careernexus.com',
            crypt('Student@009X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student009', 'full_name', 'Arjun Chopra', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student009',
        'student009@careernexus.com',
        'Arjun Chopra',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741783?w=150&auto=format&fit=crop&q=80',
        'Artificial Intelligence & Data Science',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 10: student010 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000010';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student010@careernexus.com',
            crypt('Student@010X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student010', 'full_name', 'Meera Gupta', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student010',
        'student010@careernexus.com',
        'Meera Gupta',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741784?w=150&auto=format&fit=crop&q=80',
        'Electronics & Communication',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 11: student011 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000011';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student011@careernexus.com',
            crypt('Student@011X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student011', 'full_name', 'Dev Joshi', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student011',
        'student011@careernexus.com',
        'Dev Joshi',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741785?w=150&auto=format&fit=crop&q=80',
        'Electrical & Electronics Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 12: student012 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000012';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student012@careernexus.com',
            crypt('Student@012X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student012', 'full_name', 'Pooja Bhat', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student012',
        'student012@careernexus.com',
        'Pooja Bhat',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741786?w=150&auto=format&fit=crop&q=80',
        'Mechanical Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 13: student013 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000013';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student013@careernexus.com',
            crypt('Student@013X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student013', 'full_name', 'Rahul Deshmukh', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student013',
        'student013@careernexus.com',
        'Rahul Deshmukh',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741787?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 14: student014 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000014';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student014@careernexus.com',
            crypt('Student@014X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student014', 'full_name', 'Priya Malhotra', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student014',
        'student014@careernexus.com',
        'Priya Malhotra',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741788?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 15: student015 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000015';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student015@careernexus.com',
            crypt('Student@015X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student015', 'full_name', 'Varun Rao', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student015',
        'student015@careernexus.com',
        'Varun Rao',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741789?w=150&auto=format&fit=crop&q=80',
        'Artificial Intelligence & Data Science',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 16: student016 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000016';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student016@careernexus.com',
            crypt('Student@016X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student016', 'full_name', 'Neha Bose', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student016',
        'student016@careernexus.com',
        'Neha Bose',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741790?w=150&auto=format&fit=crop&q=80',
        'Electronics & Communication',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 17: student017 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000017';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student017@careernexus.com',
            crypt('Student@017X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student017', 'full_name', 'Siddharth Kapoor', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student017',
        'student017@careernexus.com',
        'Siddharth Kapoor',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741791?w=150&auto=format&fit=crop&q=80',
        'Electrical & Electronics Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 18: student018 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000018';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student018@careernexus.com',
            crypt('Student@018X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student018', 'full_name', 'Ritu Menon', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student018',
        'student018@careernexus.com',
        'Ritu Menon',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741792?w=150&auto=format&fit=crop&q=80',
        'Mechanical Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 19: student019 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000019';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student019@careernexus.com',
            crypt('Student@019X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student019', 'full_name', 'Karan Kulkarni', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student019',
        'student019@careernexus.com',
        'Karan Kulkarni',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741793?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 20: student020 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000020';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student020@careernexus.com',
            crypt('Student@020X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student020', 'full_name', 'Tanvi Agarwal', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student020',
        'student020@careernexus.com',
        'Tanvi Agarwal',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741794?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 21: student021 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000021';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student021@careernexus.com',
            crypt('Student@021X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student021', 'full_name', 'Nikhil Saxena', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student021',
        'student021@careernexus.com',
        'Nikhil Saxena',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741795?w=150&auto=format&fit=crop&q=80',
        'Artificial Intelligence & Data Science',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 22: student022 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000022';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student022@careernexus.com',
            crypt('Student@022X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student022', 'full_name', 'Simran Pandey', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student022',
        'student022@careernexus.com',
        'Simran Pandey',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741796?w=150&auto=format&fit=crop&q=80',
        'Electronics & Communication',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 23: student023 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000023';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student023@careernexus.com',
            crypt('Student@023X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student023', 'full_name', 'Akash Mishra', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student023',
        'student023@careernexus.com',
        'Akash Mishra',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741797?w=150&auto=format&fit=crop&q=80',
        'Electrical & Electronics Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 24: student024 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000024';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student024@careernexus.com',
            crypt('Student@024X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student024', 'full_name', 'Shreya Trivedi', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student024',
        'student024@careernexus.com',
        'Shreya Trivedi',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741798?w=150&auto=format&fit=crop&q=80',
        'Mechanical Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 25: student025 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000025';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student025@careernexus.com',
            crypt('Student@025X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student025', 'full_name', 'Manish Ghosh', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student025',
        'student025@careernexus.com',
        'Manish Ghosh',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741799?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 26: student026 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000026';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student026@careernexus.com',
            crypt('Student@026X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student026', 'full_name', 'Tara Chatterjee', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student026',
        'student026@careernexus.com',
        'Tara Chatterjee',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741800?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 27: student027 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000027';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student027@careernexus.com',
            crypt('Student@027X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student027', 'full_name', 'Vivek Dutta', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student027',
        'student027@careernexus.com',
        'Vivek Dutta',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741801?w=150&auto=format&fit=crop&q=80',
        'Artificial Intelligence & Data Science',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 28: student028 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000028';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student028@careernexus.com',
            crypt('Student@028X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student028', 'full_name', 'Nisha Pillai', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student028',
        'student028@careernexus.com',
        'Nisha Pillai',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741802?w=150&auto=format&fit=crop&q=80',
        'Electronics & Communication',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 29: student029 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000029';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student029@careernexus.com',
            crypt('Student@029X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student029', 'full_name', 'Rishi Shetty', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student029',
        'student029@careernexus.com',
        'Rishi Shetty',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741803?w=150&auto=format&fit=crop&q=80',
        'Electrical & Electronics Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 30: student030 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000030';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student030@careernexus.com',
            crypt('Student@030X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student030', 'full_name', 'Kriti Hegde', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student030',
        'student030@careernexus.com',
        'Kriti Hegde',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741804?w=150&auto=format&fit=crop&q=80',
        'Mechanical Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 31: student031 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000031';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student031@careernexus.com',
            crypt('Student@031X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student031', 'full_name', 'Harsh Chauhan', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student031',
        'student031@careernexus.com',
        'Harsh Chauhan',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741805?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 32: student032 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000032';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student032@careernexus.com',
            crypt('Student@032X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student032', 'full_name', 'Anushka Thakur', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student032',
        'student032@careernexus.com',
        'Anushka Thakur',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741806?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 33: student033 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000033';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student033@careernexus.com',
            crypt('Student@033X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student033', 'full_name', 'Gaurav Yadav', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student033',
        'student033@careernexus.com',
        'Gaurav Yadav',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741807?w=150&auto=format&fit=crop&q=80',
        'Artificial Intelligence & Data Science',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 34: student034 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000034';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student034@careernexus.com',
            crypt('Student@034X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student034', 'full_name', 'Aditi Rathore', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student034',
        'student034@careernexus.com',
        'Aditi Rathore',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741808?w=150&auto=format&fit=crop&q=80',
        'Electronics & Communication',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 35: student035 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000035';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student035@careernexus.com',
            crypt('Student@035X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student035', 'full_name', 'Pranav Goyal', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student035',
        'student035@careernexus.com',
        'Pranav Goyal',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741809?w=150&auto=format&fit=crop&q=80',
        'Electrical & Electronics Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 36: student036 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000036';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student036@careernexus.com',
            crypt('Student@036X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student036', 'full_name', 'Payal Bansal', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student036',
        'student036@careernexus.com',
        'Payal Bansal',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741810?w=150&auto=format&fit=crop&q=80',
        'Mechanical Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 37: student037 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000037';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student037@careernexus.com',
            crypt('Student@037X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student037', 'full_name', 'Sameer Singhal', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student037',
        'student037@careernexus.com',
        'Sameer Singhal',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741811?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 38: student038 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000038';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student038@careernexus.com',
            crypt('Student@038X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student038', 'full_name', 'Swati Khatri', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student038',
        'student038@careernexus.com',
        'Swati Khatri',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741812?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 39: student039 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000039';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student039@careernexus.com',
            crypt('Student@039X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student039', 'full_name', 'Kunal Bhardwaj', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student039',
        'student039@careernexus.com',
        'Kunal Bhardwaj',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741813?w=150&auto=format&fit=crop&q=80',
        'Artificial Intelligence & Data Science',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 40: student040 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000040';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student040@careernexus.com',
            crypt('Student@040X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student040', 'full_name', 'Bhavna Somani', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student040',
        'student040@careernexus.com',
        'Bhavna Somani',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741814?w=150&auto=format&fit=crop&q=80',
        'Electronics & Communication',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 41: student041 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000041';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student041@careernexus.com',
            crypt('Student@041X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student041', 'full_name', 'Tarun Jain', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student041',
        'student041@careernexus.com',
        'Tarun Jain',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741815?w=150&auto=format&fit=crop&q=80',
        'Electrical & Electronics Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 42: student042 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000042';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student042@careernexus.com',
            crypt('Student@042X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student042', 'full_name', 'Deepika Bhattacharya', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student042',
        'student042@careernexus.com',
        'Deepika Bhattacharya',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741816?w=150&auto=format&fit=crop&q=80',
        'Mechanical Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 43: student043 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000043';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student043@careernexus.com',
            crypt('Student@043X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student043', 'full_name', 'Ayush Mukherjee', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student043',
        'student043@careernexus.com',
        'Ayush Mukherjee',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741817?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 44: student044 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000044';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student044@careernexus.com',
            crypt('Student@044X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student044', 'full_name', 'Rhea Das', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student044',
        'student044@careernexus.com',
        'Rhea Das',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741818?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 45: student045 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000045';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student045@careernexus.com',
            crypt('Student@045X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student045', 'full_name', 'Abhinav Roy', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student045',
        'student045@careernexus.com',
        'Abhinav Roy',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741819?w=150&auto=format&fit=crop&q=80',
        'Artificial Intelligence & Data Science',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 46: student046 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000046';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student046@careernexus.com',
            crypt('Student@046X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student046', 'full_name', 'Shalini Chakraborty', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student046',
        'student046@careernexus.com',
        'Shalini Chakraborty',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741820?w=150&auto=format&fit=crop&q=80',
        'Electronics & Communication',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 47: student047 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000047';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student047@careernexus.com',
            crypt('Student@047X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student047', 'full_name', 'Kartik Nambiar', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student047',
        'student047@careernexus.com',
        'Kartik Nambiar',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741821?w=150&auto=format&fit=crop&q=80',
        'Electrical & Electronics Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 48: student048 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000048';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student048@careernexus.com',
            crypt('Student@048X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student048', 'full_name', 'Sonia Kurian', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student048',
        'student048@careernexus.com',
        'Sonia Kurian',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741822?w=150&auto=format&fit=crop&q=80',
        'Mechanical Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 49: student049 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000049';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student049@careernexus.com',
            crypt('Student@049X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student049', 'full_name', 'Yash Prasad', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student049',
        'student049@careernexus.com',
        'Yash Prasad',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741823?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 50: student050 (student)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0001-000000000050';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'student050@careernexus.com',
            crypt('Student@050X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'student050', 'full_name', 'Shruti Sinha', 'role', 'student'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'student050',
        'student050@careernexus.com',
        'Shruti Sinha',
        'student'::user_role,
        'https://images.unsplash.com/photo-1534528741824?w=150&auto=format&fit=crop&q=80',
        'Information Technology',
        '',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 51: alumni001 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000001';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni001@careernexus.com',
            crypt('Alumni@001X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni001', 'full_name', 'Dev Joshi', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni001',
        'alumni001@careernexus.com',
        'Dev Joshi',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359192?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Google',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 52: alumni002 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000002';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni002@careernexus.com',
            crypt('Alumni@002X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni002', 'full_name', 'Pooja Bhat', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni002',
        'alumni002@careernexus.com',
        'Pooja Bhat',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359193?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Microsoft',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 53: alumni003 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000003';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni003@careernexus.com',
            crypt('Alumni@003X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni003', 'full_name', 'Rahul Deshmukh', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni003',
        'alumni003@careernexus.com',
        'Rahul Deshmukh',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359194?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Amazon',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 54: alumni004 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000004';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni004@careernexus.com',
            crypt('Alumni@004X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni004', 'full_name', 'Priya Malhotra', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni004',
        'alumni004@careernexus.com',
        'Priya Malhotra',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359195?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Atlassian',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 55: alumni005 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000005';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni005@careernexus.com',
            crypt('Alumni@005X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni005', 'full_name', 'Varun Rao', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni005',
        'alumni005@careernexus.com',
        'Varun Rao',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359196?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Adobe',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 56: alumni006 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000006';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni006@careernexus.com',
            crypt('Alumni@006X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni006', 'full_name', 'Neha Bose', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni006',
        'alumni006@careernexus.com',
        'Neha Bose',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359197?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Cisco Systems',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 57: alumni007 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000007';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni007@careernexus.com',
            crypt('Alumni@007X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni007', 'full_name', 'Siddharth Kapoor', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni007',
        'alumni007@careernexus.com',
        'Siddharth Kapoor',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359198?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'NVIDIA',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 58: alumni008 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000008';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni008@careernexus.com',
            crypt('Alumni@008X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni008', 'full_name', 'Ritu Menon', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni008',
        'alumni008@careernexus.com',
        'Ritu Menon',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359199?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Goldman Sachs',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 59: alumni009 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000009';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni009@careernexus.com',
            crypt('Alumni@009X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni009', 'full_name', 'Karan Kulkarni', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni009',
        'alumni009@careernexus.com',
        'Karan Kulkarni',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359200?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Uber',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 60: alumni010 (alumni)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0002-000000000010';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'alumni010@careernexus.com',
            crypt('Alumni@010X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'alumni010', 'full_name', 'Tanvi Agarwal', 'role', 'alumni'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'alumni010',
        'alumni010@careernexus.com',
        'Tanvi Agarwal',
        'alumni'::user_role,
        'https://images.unsplash.com/photo-1573496359201?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Razorpay',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 61: recruiter001 (recruiter)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0003-000000000001';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'recruiter001@careernexus.com',
            crypt('Recruiter@001X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'recruiter001', 'full_name', 'Marcus Vance (Google Talent Acquisition)', 'role', 'recruiter'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'recruiter001',
        'recruiter001@careernexus.com',
        'Marcus Vance (Google Talent Acquisition)',
        'recruiter'::user_role,
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        'University Recruiting',
        'Google',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- Account 62: admin001 (admin)
DO $$
DECLARE
    v_uid UUID := '00000000-0000-0000-0004-000000000001';
BEGIN
    -- 1. Insert into auth.users with bcrypt encrypted password (NEVER plaintext)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            v_uid,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'admin001@careernexus.com',
            crypt('Admin@001X', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('username', 'admin001', 'full_name', 'Dr. Anand Verma', 'role', 'admin'),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            encrypted_password = EXCLUDED.encrypted_password,
            raw_user_meta_data = EXCLUDED.raw_user_meta_data,
            updated_at = NOW();
    END IF;

    -- 2. Insert into public.users
    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        'admin001',
        'admin001@careernexus.com',
        'Dr. Anand Verma',
        'admin'::user_role,
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        'Placement & Career Development Cell',
        'CareerNexus Central Administration',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- ==============================================================================
-- 3. SEED public.students (50 Students with Distinct Real Profile Data)
-- ==============================================================================

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Aarav Sharma',
    'student001@careernexus.com',
    '23CS001',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    9.24,
    82.0,
    80.0,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0001-000000000002',
    'Diya Patel',
    'student002@careernexus.com',
    '23CS002',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    8.65,
    82.3,
    80.3,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0001-000000000003',
    'Rohan Verma',
    'student003@careernexus.com',
    '23CS003',
    'Artificial Intelligence & Data Science',
    'B.Tech',
    '2023-2027',
    2027,
    7.60,
    82.6,
    80.7,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0001-000000000004',
    'Ananya Sen',
    'student004@careernexus.com',
    '23CS004',
    'Electronics & Communication',
    'B.Tech',
    '2023-2027',
    2027,
    7.65,
    82.9,
    81.0,
    'Software Development',
    'Selected',
    'Microsoft',
    '₹32 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0001-000000000005',
    'Kavya Reddy',
    'student005@careernexus.com',
    '23CS005',
    'Electrical & Electronics Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    7.70,
    83.2,
    81.4,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000006',
    '00000000-0000-0000-0001-000000000006',
    'Aditya Iyer',
    'student006@careernexus.com',
    '23CS006',
    'Mechanical Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    7.75,
    83.5,
    81.8,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000007',
    '00000000-0000-0000-0001-000000000007',
    'Ishaan Nair',
    'student007@careernexus.com',
    '23CS007',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    7.80,
    83.8,
    82.1,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000008',
    '00000000-0000-0000-0001-000000000008',
    'Sneha Mehta',
    'student008@careernexus.com',
    '23CS008',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    7.85,
    84.1,
    82.5,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000009',
    '00000000-0000-0000-0001-000000000009',
    'Arjun Chopra',
    'student009@careernexus.com',
    '23CS009',
    'Artificial Intelligence & Data Science',
    'B.Tech',
    '2023-2027',
    2027,
    7.90,
    84.4,
    82.8,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000010',
    '00000000-0000-0000-0001-000000000010',
    'Meera Gupta',
    'student010@careernexus.com',
    '23CS010',
    'Electronics & Communication',
    'B.Tech',
    '2023-2027',
    2027,
    7.95,
    84.7,
    83.2,
    'Software Development',
    'Selected',
    'Microsoft',
    '₹32 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000011',
    '00000000-0000-0000-0001-000000000011',
    'Dev Joshi',
    'student011@careernexus.com',
    '23CS011',
    'Electrical & Electronics Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.00,
    85.0,
    83.5,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000012',
    '00000000-0000-0000-0001-000000000012',
    'Pooja Bhat',
    'student012@careernexus.com',
    '23CS012',
    'Mechanical Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.05,
    85.3,
    83.8,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000013',
    '00000000-0000-0000-0001-000000000013',
    'Rahul Deshmukh',
    'student013@careernexus.com',
    '23CS013',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.10,
    85.6,
    84.2,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000014',
    '00000000-0000-0000-0001-000000000014',
    'Priya Malhotra',
    'student014@careernexus.com',
    '23CS014',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    8.15,
    85.9,
    84.5,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000015',
    '00000000-0000-0000-0001-000000000015',
    'Varun Rao',
    'student015@careernexus.com',
    '23CS015',
    'Artificial Intelligence & Data Science',
    'B.Tech',
    '2023-2027',
    2027,
    8.20,
    86.2,
    84.9,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000016',
    '00000000-0000-0000-0001-000000000016',
    'Neha Bose',
    'student016@careernexus.com',
    '23CS016',
    'Electronics & Communication',
    'B.Tech',
    '2023-2027',
    2027,
    8.25,
    86.5,
    85.3,
    'Software Development',
    'Selected',
    'Microsoft',
    '₹32 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000017',
    '00000000-0000-0000-0001-000000000017',
    'Siddharth Kapoor',
    'student017@careernexus.com',
    '23CS017',
    'Electrical & Electronics Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.30,
    86.8,
    85.6,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000018',
    '00000000-0000-0000-0001-000000000018',
    'Ritu Menon',
    'student018@careernexus.com',
    '23CS018',
    'Mechanical Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.35,
    87.1,
    86.0,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000019',
    '00000000-0000-0000-0001-000000000019',
    'Karan Kulkarni',
    'student019@careernexus.com',
    '23CS019',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.40,
    87.4,
    86.3,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000020',
    '00000000-0000-0000-0001-000000000020',
    'Tanvi Agarwal',
    'student020@careernexus.com',
    '23CS020',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    8.45,
    87.7,
    86.7,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000021',
    '00000000-0000-0000-0001-000000000021',
    'Nikhil Saxena',
    'student021@careernexus.com',
    '23CS021',
    'Artificial Intelligence & Data Science',
    'B.Tech',
    '2023-2027',
    2027,
    8.50,
    88.0,
    87.0,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000022',
    '00000000-0000-0000-0001-000000000022',
    'Simran Pandey',
    'student022@careernexus.com',
    '23CS022',
    'Electronics & Communication',
    'B.Tech',
    '2023-2027',
    2027,
    8.55,
    88.3,
    87.3,
    'Software Development',
    'Selected',
    'Microsoft',
    '₹32 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000023',
    '00000000-0000-0000-0001-000000000023',
    'Akash Mishra',
    'student023@careernexus.com',
    '23CS023',
    'Electrical & Electronics Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.60,
    88.6,
    87.7,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000024',
    '00000000-0000-0000-0001-000000000024',
    'Shreya Trivedi',
    'student024@careernexus.com',
    '23CS024',
    'Mechanical Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.65,
    88.9,
    88.0,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000025',
    '00000000-0000-0000-0001-000000000025',
    'Manish Ghosh',
    'student025@careernexus.com',
    '23CS025',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.70,
    89.2,
    88.4,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000026',
    '00000000-0000-0000-0001-000000000026',
    'Tara Chatterjee',
    'student026@careernexus.com',
    '23CS026',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    8.75,
    89.5,
    88.8,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000027',
    '00000000-0000-0000-0001-000000000027',
    'Vivek Dutta',
    'student027@careernexus.com',
    '23CS027',
    'Artificial Intelligence & Data Science',
    'B.Tech',
    '2023-2027',
    2027,
    8.80,
    89.8,
    89.1,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000028',
    '00000000-0000-0000-0001-000000000028',
    'Nisha Pillai',
    'student028@careernexus.com',
    '23CS028',
    'Electronics & Communication',
    'B.Tech',
    '2023-2027',
    2027,
    8.85,
    90.1,
    89.5,
    'Software Development',
    'Selected',
    'Microsoft',
    '₹32 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000029',
    '00000000-0000-0000-0001-000000000029',
    'Rishi Shetty',
    'student029@careernexus.com',
    '23CS029',
    'Electrical & Electronics Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.90,
    90.4,
    89.8,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000030',
    '00000000-0000-0000-0001-000000000030',
    'Kriti Hegde',
    'student030@careernexus.com',
    '23CS030',
    'Mechanical Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    8.95,
    90.7,
    90.2,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000031',
    '00000000-0000-0000-0001-000000000031',
    'Harsh Chauhan',
    'student031@careernexus.com',
    '23CS031',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    9.00,
    91.0,
    90.5,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000032',
    '00000000-0000-0000-0001-000000000032',
    'Anushka Thakur',
    'student032@careernexus.com',
    '23CS032',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    9.05,
    91.3,
    90.8,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000033',
    '00000000-0000-0000-0001-000000000033',
    'Gaurav Yadav',
    'student033@careernexus.com',
    '23CS033',
    'Artificial Intelligence & Data Science',
    'B.Tech',
    '2023-2027',
    2027,
    9.10,
    91.6,
    91.2,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000034',
    '00000000-0000-0000-0001-000000000034',
    'Aditi Rathore',
    'student034@careernexus.com',
    '23CS034',
    'Electronics & Communication',
    'B.Tech',
    '2023-2027',
    2027,
    9.15,
    91.9,
    91.5,
    'Software Development',
    'Selected',
    'Microsoft',
    '₹32 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000035',
    '00000000-0000-0000-0001-000000000035',
    'Pranav Goyal',
    'student035@careernexus.com',
    '23CS035',
    'Electrical & Electronics Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    9.20,
    92.2,
    91.9,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000036',
    '00000000-0000-0000-0001-000000000036',
    'Payal Bansal',
    'student036@careernexus.com',
    '23CS036',
    'Mechanical Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    9.25,
    92.5,
    92.3,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000037',
    '00000000-0000-0000-0001-000000000037',
    'Sameer Singhal',
    'student037@careernexus.com',
    '23CS037',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    9.30,
    92.8,
    92.6,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000038',
    '00000000-0000-0000-0001-000000000038',
    'Swati Khatri',
    'student038@careernexus.com',
    '23CS038',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    9.35,
    93.1,
    93.0,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000039',
    '00000000-0000-0000-0001-000000000039',
    'Kunal Bhardwaj',
    'student039@careernexus.com',
    '23CS039',
    'Artificial Intelligence & Data Science',
    'B.Tech',
    '2023-2027',
    2027,
    9.40,
    93.4,
    93.3,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000040',
    '00000000-0000-0000-0001-000000000040',
    'Bhavna Somani',
    'student040@careernexus.com',
    '23CS040',
    'Electronics & Communication',
    'B.Tech',
    '2023-2027',
    2027,
    9.45,
    93.7,
    93.7,
    'Software Development',
    'Selected',
    'Microsoft',
    '₹32 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000041',
    '00000000-0000-0000-0001-000000000041',
    'Tarun Jain',
    'student041@careernexus.com',
    '23CS041',
    'Electrical & Electronics Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    9.50,
    94.0,
    94.0,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000042',
    '00000000-0000-0000-0001-000000000042',
    'Deepika Bhattacharya',
    'student042@careernexus.com',
    '23CS042',
    'Mechanical Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    9.55,
    94.3,
    94.3,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000043',
    '00000000-0000-0000-0001-000000000043',
    'Ayush Mukherjee',
    'student043@careernexus.com',
    '23CS043',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    9.60,
    94.6,
    94.7,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000044',
    '00000000-0000-0000-0001-000000000044',
    'Rhea Das',
    'student044@careernexus.com',
    '23CS044',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    9.65,
    94.9,
    95.0,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000045',
    '00000000-0000-0000-0001-000000000045',
    'Abhinav Roy',
    'student045@careernexus.com',
    '23CS045',
    'Artificial Intelligence & Data Science',
    'B.Tech',
    '2023-2027',
    2027,
    9.70,
    95.2,
    95.4,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000046',
    '00000000-0000-0000-0001-000000000046',
    'Shalini Chakraborty',
    'student046@careernexus.com',
    '23CS046',
    'Electronics & Communication',
    'B.Tech',
    '2023-2027',
    2027,
    9.75,
    95.5,
    95.8,
    'Software Development',
    'Selected',
    'Microsoft',
    '₹32 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000047',
    '00000000-0000-0000-0001-000000000047',
    'Kartik Nambiar',
    'student047@careernexus.com',
    '23CS047',
    'Electrical & Electronics Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    7.50,
    95.8,
    96.1,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000048',
    '00000000-0000-0000-0001-000000000048',
    'Sonia Kurian',
    'student048@careernexus.com',
    '23CS048',
    'Mechanical Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    7.55,
    96.1,
    96.5,
    'Software Development',
    'Not Placed',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000049',
    '00000000-0000-0000-0001-000000000049',
    'Yash Prasad',
    'student049@careernexus.com',
    '23CS049',
    'Computer Science & Engineering',
    'B.Tech',
    '2023-2027',
    2027,
    7.60,
    96.4,
    96.8,
    'Software Development',
    'Selected',
    'Google',
    '₹42 LPA',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

INSERT INTO public.students (
    id, user_id, full_name, email, roll_number, department, course, batch, graduation_year,
    cgpa, tenth_percentage, twelfth_percentage, preferred_domain, placement_status,
    placed_company, placed_package, skills, profile_completion, is_active
) VALUES (
    's-00000000-0000-0000-0001-000000000050',
    '00000000-0000-0000-0001-000000000050',
    'Shruti Sinha',
    'student050@careernexus.com',
    '23CS050',
    'Information Technology',
    'B.Tech',
    '2023-2027',
    2027,
    7.65,
    96.7,
    97.2,
    'Software Development',
    'In Progress',
    '',
    '',
    ARRAY['Java', 'Python', 'Algorithms', 'SQL', 'TypeScript'],
    85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    cgpa = EXCLUDED.cgpa,
    placement_status = EXCLUDED.placement_status,
    placed_company = EXCLUDED.placed_company,
    placed_package = EXCLUDED.placed_package,
    skills = EXCLUDED.skills;

-- ==============================================================================
-- 4. SEED public.alumni (10 Alumni with Distinct Industry Roles & Mentorship)
-- ==============================================================================

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'ALUM-2022-CSE001',
    'Dev Joshi',
    'alumni001@careernexus.com',
    'Google',
    'Senior Staff Software Engineer',
    6.5,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    18,
    4.73,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000002',
    '00000000-0000-0000-0002-000000000002',
    'ALUM-2022-CSE002',
    'Pooja Bhat',
    'alumni002@careernexus.com',
    'Microsoft',
    'Principal Cloud Architect',
    5.8,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    21,
    4.75,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000003',
    '00000000-0000-0000-0002-000000000003',
    'ALUM-2022-CSE003',
    'Rahul Deshmukh',
    'alumni003@careernexus.com',
    'Amazon',
    'Software Development Engineer III',
    4.8,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    24,
    4.78,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000004',
    '00000000-0000-0000-0002-000000000004',
    'ALUM-2022-CSE004',
    'Priya Malhotra',
    'alumni004@careernexus.com',
    'Atlassian',
    'Staff Frontend Engineer',
    5.2,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    27,
    4.80,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000005',
    '00000000-0000-0000-0002-000000000005',
    'ALUM-2022-CSE005',
    'Varun Rao',
    'alumni005@careernexus.com',
    'Adobe',
    'Senior Computer Vision Engineer',
    4.2,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    30,
    4.83,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000006',
    '00000000-0000-0000-0002-000000000006',
    'ALUM-2022-CSE006',
    'Neha Bose',
    'alumni006@careernexus.com',
    'Cisco Systems',
    'Lead Network Security Engineer',
    6,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    33,
    4.85,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000007',
    '00000000-0000-0000-0002-000000000007',
    'ALUM-2022-CSE007',
    'Siddharth Kapoor',
    'alumni007@careernexus.com',
    'NVIDIA',
    'Senior CUDA Performance Engineer',
    5.5,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    36,
    4.88,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000008',
    '00000000-0000-0000-0002-000000000008',
    'ALUM-2022-CSE008',
    'Ritu Menon',
    'alumni008@careernexus.com',
    'Goldman Sachs',
    'Vice President - Quantitative Tech',
    7,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    39,
    4.90,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000009',
    '00000000-0000-0000-0002-000000000009',
    'ALUM-2022-CSE009',
    'Karan Kulkarni',
    'alumni009@careernexus.com',
    'Uber',
    'Staff Distributed Systems Engineer',
    5.9,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    42,
    4.92,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

INSERT INTO public.alumni (
    id, user_id, alumni_id, full_name, email, company, designation, experience_years,
    graduation_year, department, available_for_mentoring, is_verified, mentees_count, rating, is_active
) VALUES (
    'a-00000000-0000-0000-0002-000000000010',
    '00000000-0000-0000-0002-000000000010',
    'ALUM-2022-CSE010',
    'Tanvi Agarwal',
    'alumni010@careernexus.com',
    'Razorpay',
    'Engineering Lead - Payments Gateway',
    4.6,
    2022,
    'Computer Science & Engineering',
    TRUE,
    TRUE,
    45,
    4.95,
    TRUE
) ON CONFLICT (user_id) DO UPDATE SET
    company = EXCLUDED.company,
    designation = EXCLUDED.designation,
    experience_years = EXCLUDED.experience_years,
    available_for_mentoring = EXCLUDED.available_for_mentoring;

-- ==============================================================================
-- 5. SEED Distinct User Interactions (Applications, Mentorships, Chats, Notifications)
-- ==============================================================================

-- Applications for student001 (Google Selected) and student002 (In Progress)
INSERT INTO public.applications (id, job_id, student_id, status, applied_at, cover_letter)
VALUES
('app-00000001', 'j0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'Selected', NOW() - INTERVAL '10 days', 'Passionate about distributed storage and algorithmic problem solving.'),
('app-00000002', 'j0000002-0000-0000-0000-000000000002', '00000000-0000-0000-0001-000000000001', 'Shortlisted', NOW() - INTERVAL '7 days', 'Strong background in cloud microservices and systems design.'),
('app-00000003', 'j0000004-0000-0000-0000-000000000004', '00000000-0000-0000-0001-000000000002', 'Under Review', NOW() - INTERVAL '4 days', 'Crafting high-speed collaborative web frontend experiences.'),
('app-00000004', 'j0000003-0000-0000-0000-000000000003', '00000000-0000-0000-0001-000000000002', 'Assessment Completed', NOW() - INTERVAL '2 days', 'E-commerce logistics and distributed data stores.')
ON CONFLICT (id) DO NOTHING;

-- Mentorship Connections (student001 connected with alumni001, student002 pending with alumni002)
INSERT INTO public.connections (
    id, requester_id, receiver_id, requester_name, receiver_name,
    connection_type, status, mentorship_topic, message, created_at, accepted_at
) VALUES
(
    'conn-00000001',
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Aarav Sharma',
    'Vikram Singhania',
    'mentorship',
    'accepted',
    'Distributed Systems & Google Interview Prep',
    'Hello Vikram Sir, I would love your guidance on preparing for the Google FTE technical rounds.',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
),
(
    'conn-00000002',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0002-000000000002',
    'Diya Patel',
    'Ananya Sen',
    'mentorship',
    'pending',
    'Frontend Architecture & Career Roadmap',
    'Hi Ananya Maam, hoping to connect regarding cloud architecture and modern web platforms.',
    NOW() - INTERVAL '2 days',
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- Isolated Chat Conversation between student001 and alumni001
INSERT INTO public.conversations (id, type, created_at, updated_at)
VALUES (
    'conv-mentorship-00000000-0000-0000-0001-000000000001_00000000-0000-0000-0002-000000000001',
    'direct',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.messages (id, conversation_id, sender_id, receiver_id, message_text, is_read, created_at)
VALUES
(
    'msg-00000001',
    'conv-mentorship-00000000-0000-0000-0001-000000000001_00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Thank you for accepting my mentorship request! Excited to learn from your experience at Google.',
    TRUE,
    NOW() - INTERVAL '3 days'
),
(
    'msg-00000002',
    'conv-mentorship-00000000-0000-0000-0001-000000000001_00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Welcome Aarav! Review your trees and graph algorithms, and focus on clean modular code structure.',
    TRUE,
    NOW() - INTERVAL '2 days'
),
(
    'msg-00000003',
    'conv-mentorship-00000000-0000-0000-0001-000000000001_00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'We can set up a mock system design interview this weekend.',
    FALSE,
    NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- Notifications across Roles
INSERT INTO public.notifications (id, user_id, sender_id, type, title, message, link, is_read, created_at)
VALUES
-- student001 notifications
('notif-00000001', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0002-000000000001', 'mentorship_accepted', 'Mentorship Accepted', 'Vikram Singhania accepted your mentorship request.', '/student/messages', FALSE, NOW() - INTERVAL '4 days'),
('notif-00000002', '00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0003-000000000001', 'offer_selected', 'Offer Letter Released: Google', 'Congratulations! You have been selected for Google SDE (₹42 LPA).', '/student/applications', FALSE, NOW() - INTERVAL '1 day'),

-- student002 notifications
('notif-00000003', '00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0004-000000000001', 'assessment_invite', 'Atlassian Coding Assessment', 'Your online assessment for Atlassian Frontend Platform is scheduled.', '/student/assessments', FALSE, NOW() - INTERVAL '2 days'),

-- alumni001 notifications
('notif-00000004', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'chat_message', 'New Message from Aarav Sharma', 'Aarav replied to your mock interview suggestion.', '/alumni/mentorship', FALSE, NOW() - INTERVAL '1 hour'),

-- alumni002 notifications
('notif-00000005', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', 'mentorship_request', 'New Mentorship Request', 'Diya Patel requested mentorship in Frontend Architecture.', '/alumni/mentorship', FALSE, NOW() - INTERVAL '2 days'),

-- recruiter001 notifications
('notif-00000006', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0004-000000000001', 'applicant_applied', 'Candidate Applied to Google SDE', 'Aarav Sharma submitted an application for SDE - Intern + FTE.', '/recruiter/applicants', FALSE, NOW() - INTERVAL '10 days'),

-- admin001 notifications
('notif-00000007', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0003-000000000001', 'drive_update', 'Drive Finalized: Google', 'Placement Drive for Google SDE completed with 8 offers.', '/admin/command-center', FALSE, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
