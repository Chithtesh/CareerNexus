-- ==============================================================================
-- CareerNexus — Complete Authentication, Profile Provisioning & RLS Fix
-- Migration: 20261008_auth_fix_rls_and_provisioning.sql
-- Description: 
--   1. Fix RLS policies on public.users so newly authenticated users can insert and read their profile.
--   2. Implement automated auth.users trigger that creates public.users and role profiles.
--   3. Ensure default role is 'student' and prevent self-registration as admin.
--   4. Ensure secure resolve_user_for_login helper works for both email and username logins.
-- ==============================================================================

-- 1. Ensure user_role type exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'alumni', 'recruiter', 'admin');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Ensure public.users table structure
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

-- Ensure columns exist
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS department TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Unique lowercase index on email and username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (LOWER(TRIM(email)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(TRIM(username))) WHERE username IS NOT NULL AND TRIM(username) <> '';

-- 3. Fix Row-Level Security (RLS) on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies to prevent conflicts
DROP POLICY IF EXISTS "users_select_authorized" ON public.users;
DROP POLICY IF EXISTS "users_select_self" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;

-- Policy: Users can read their own profile, or other profiles if authenticated
CREATE POLICY "users_select_authorized" ON public.users
FOR SELECT TO authenticated
USING (
    id = auth.uid()
    OR TRUE -- Authenticated users can browse academic & professional network profiles
);

-- Policy: Users can insert their own profile matching auth.uid()
CREATE POLICY "users_insert_own_profile" ON public.users
FOR INSERT TO authenticated
WITH CHECK (
    id = auth.uid()
);

-- Policy: Users can update their own profile; admins can update any profile
CREATE POLICY "users_update_own_profile" ON public.users
FOR UPDATE TO authenticated
USING (
    id = auth.uid()
    OR (SELECT role::TEXT FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
)
WITH CHECK (
    id = auth.uid()
    OR (SELECT role::TEXT FROM public.users WHERE id = auth.uid() LIMIT 1) = 'admin'
);

-- 4. Fix RLS on students and alumni profile tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
DROP POLICY IF EXISTS "students_insert_own_policy" ON public.students;
DROP POLICY IF EXISTS "students_update_own_policy" ON public.students;

CREATE POLICY "students_select_policy" ON public.students
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "students_insert_own_policy" ON public.students
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "students_update_own_policy" ON public.students
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alumni_select_policy" ON public.alumni;
DROP POLICY IF EXISTS "alumni_insert_own_policy" ON public.alumni;
DROP POLICY IF EXISTS "alumni_update_own_policy" ON public.alumni;

CREATE POLICY "alumni_select_policy" ON public.alumni
FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "alumni_insert_own_policy" ON public.alumni
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "alumni_update_own_policy" ON public.alumni
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Automatic Profile Provisioning Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_raw_role TEXT;
    v_role user_role;
    v_full_name TEXT;
    v_username TEXT;
    v_department TEXT;
    v_company TEXT;
    v_avatar TEXT;
BEGIN
    -- Read role from user metadata, strictly default to 'student'
    v_raw_role := LOWER(COALESCE(new.raw_user_meta_data->>'role', 'student'));
    
    -- Disallow public registration as admin
    IF v_raw_role = 'admin' THEN
        v_role := 'student'::user_role;
    ELSIF v_raw_role IN ('student', 'alumni', 'recruiter') THEN
        v_role := v_raw_role::user_role;
    ELSE
        v_role := 'student'::user_role;
    END IF;

    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
    v_department := COALESCE(new.raw_user_meta_data->>'department', 'Computer Science & Engineering');
    v_company := COALESCE(new.raw_user_meta_data->>'company', '');
    v_avatar := COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

    -- Insert or update public.users
    INSERT INTO public.users (
        id,
        username,
        email,
        full_name,
        role,
        avatar_url,
        department,
        company,
        is_active,
        status,
        created_at,
        updated_at
    ) VALUES (
        new.id,
        v_username,
        new.email,
        v_full_name,
        v_role,
        v_avatar,
        v_department,
        v_company,
        TRUE,
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();

    -- Create role-specific child record
    IF v_role = 'student' THEN
        INSERT INTO public.students (
            user_id,
            full_name,
            email,
            department,
            roll_number,
            profile_photo,
            is_active
        ) VALUES (
            new.id,
            v_full_name,
            new.email,
            v_department,
            COALESCE(new.raw_user_meta_data->>'roll_number', '23CS' || LPAD(FLOOR(RANDOM()*899+100)::TEXT, 3, '0')),
            v_avatar,
            TRUE
        )
        ON CONFLICT (user_id) DO NOTHING;
    ELSIF v_role = 'alumni' THEN
        INSERT INTO public.alumni (
            user_id,
            full_name,
            email,
            department,
            company,
            designation,
            profile_photo,
            is_active
        ) VALUES (
            new.id,
            v_full_name,
            new.email,
            v_department,
            COALESCE(v_company, 'Industry Leader'),
            COALESCE(new.raw_user_meta_data->>'designation', 'Software Engineer'),
            v_avatar,
            TRUE
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- Bind trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 6. Resolve Username or Email for Login
CREATE OR REPLACE FUNCTION public.resolve_user_for_login(p_identifier TEXT)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    email TEXT,
    full_name TEXT,
    role TEXT,
    avatar_url TEXT,
    is_active BOOLEAN,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.username,
        u.email,
        u.full_name,
        u.role::TEXT,
        u.avatar_url,
        u.is_active,
        u.status
    FROM public.users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_identifier))
       OR LOWER(TRIM(u.username)) = LOWER(TRIM(p_identifier))
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.resolve_user_for_login(TEXT) TO anon, authenticated, service_role;
