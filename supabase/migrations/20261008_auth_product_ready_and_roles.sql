-- ==============================================================================
-- CareerNexus — Product-Ready Authentication, Role Lockdown, & RLS Security
-- Migration: 20261008_auth_product_ready_and_roles.sql
-- Description: Enforce strict role authorization, unique username support,
--              account active status checks, admin self-elevation defense,
--              and RLS policies ensuring each user is locked to their authorized workspace.
-- ==============================================================================

-- 1. Ensure user_role ENUM exists and contains all 4 authorized roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'alumni', 'recruiter', 'admin');
EXCEPTION
    WHEN duplicate_object THEN
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'recruiter';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
END $$;

-- 2. Extend and Harden public.users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    phone TEXT,
    department TEXT,
    company TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all required columns exist in public.users
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS department TEXT,
    ADD COLUMN IF NOT EXISTS company TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3. Case-Insensitive Unique Indexes for Username and Email
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower
    ON public.users (LOWER(TRIM(username)))
    WHERE username IS NOT NULL AND TRIM(username) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower
    ON public.users (LOWER(TRIM(email)));

-- 4. Secure Helper Function: Resolve Username or Email to User Credentials
-- Used by the authentication service to look up credentials safely
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

-- Grant execution to authenticated and anon users for login resolution
GRANT EXECUTE ON FUNCTION public.resolve_user_for_login(TEXT) TO anon, authenticated, service_role;

-- 5. Standardized get_user_role() with Active Status Validation
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
    SELECT 
        CASE 
            WHEN is_active = FALSE THEN 'deactivated'
            ELSE role::TEXT 
        END
    FROM public.users 
    WHERE id = p_user_id 
    LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public, auth, pg_temp;

GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon, authenticated, service_role;

-- 6. Trigger to Prevent Non-Admins From Changing Their Own Role
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
BEGIN
    v_caller_id := auth.uid();
    
    -- If trigger is invoked in an authenticated context and role is changing
    IF v_caller_id IS NOT NULL AND OLD.role IS DISTINCT FROM NEW.role THEN
        SELECT role::TEXT INTO v_caller_role FROM public.users WHERE id = v_caller_id;
        
        -- Non-admins cannot alter roles
        IF v_caller_role <> 'admin' THEN
            RAISE EXCEPTION 'Security Violation: Only system administrators can modify user roles.';
        END IF;

        -- Admin cannot demote themselves (lockout protection)
        IF v_caller_id = OLD.id AND NEW.role <> 'admin' THEN
            RAISE EXCEPTION 'Action Blocked: Administrators cannot demote their own account to prevent administrative lockout.';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_escalation
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_self_role_escalation();

-- 7. Hardened Row-Level Security (RLS) on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_authorized" ON public.users;
CREATE POLICY "users_select_authorized" ON public.users
FOR SELECT TO authenticated
USING (
    -- Users can read their own profile
    id = auth.uid()
    -- Admins can read all profiles
    OR public.get_user_role(auth.uid()) = 'admin'
    -- Students and Alumni can view each other's basic professional cards
    OR public.get_user_role(auth.uid()) IN ('student', 'alumni', 'recruiter')
);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
CREATE POLICY "users_update_own_profile" ON public.users
FOR UPDATE TO authenticated
USING (
    id = auth.uid()
    OR public.get_user_role(auth.uid()) = 'admin'
)
WITH CHECK (
    id = auth.uid()
    OR public.get_user_role(auth.uid()) = 'admin'
);

-- 8. Seed the Four Canonical Real Test Accounts
-- Ensures student001, alumni001, recruiter001, admin001 exist with designated roles
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
    status
) VALUES
    (
        'a0000000-0000-0000-0000-000000000001',
        'student001',
        'student001@careernexus.edu',
        'Rahul Sharma',
        'student',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        NULL,
        TRUE,
        'active'
    ),
    (
        'a0000000-0000-0000-0000-000000000002',
        'alumni001',
        'alumni001@google.com',
        'Priya Nair',
        'alumni',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        'Computer Science & Engineering',
        'Google',
        TRUE,
        'active'
    ),
    (
        'a0000000-0000-0000-0000-000000000003',
        'recruiter001',
        'recruiter001@google.com',
        'Sarah Jenkins',
        'recruiter',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        NULL,
        'Google',
        TRUE,
        'active'
    ),
    (
        'a0000000-0000-0000-0000-000000000004',
        'admin001',
        'admin001@careernexus.edu',
        'Dr. Anand Verma',
        'admin',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        'Placement Administration',
        'CareerNexus University',
        TRUE,
        'active'
    )
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    is_active = TRUE,
    status = 'active',
    updated_at = NOW();

-- 9. Seed Student Profile for student001
INSERT INTO public.students (
    id,
    user_id,
    full_name,
    email,
    roll_number,
    department,
    course,
    graduation_year,
    cgpa,
    placement_status,
    skills,
    profile_photo,
    is_active
) VALUES (
    's-student001',
    'a0000000-0000-0000-0000-000000000001',
    'Rahul Sharma',
    'student001@careernexus.edu',
    '23CS042',
    'Computer Science & Engineering',
    'B.Tech',
    2027,
    8.92,
    'Shortlisted',
    ARRAY['Python', 'Java', 'Angular', 'PostgreSQL', 'Data Structures']::TEXT[],
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    TRUE
)
ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    roll_number = EXCLUDED.roll_number,
    is_active = TRUE;

-- 10. Seed Alumni Profile for alumni001
INSERT INTO public.alumni (
    id,
    user_id,
    alumni_id,
    full_name,
    email,
    profile_photo,
    graduation_year,
    department,
    company,
    designation,
    experience_years,
    skills,
    preferred_domains,
    mentorship_topics,
    available_for_mentoring,
    is_verified,
    is_active
) VALUES (
    'a-alumni001',
    'a0000000-0000-0000-0000-000000000002',
    'ALUM-2022-CSE042',
    'Priya Nair',
    'alumni001@google.com',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    2022,
    'Computer Science & Engineering',
    'Google',
    'Senior Software Engineer (L5)',
    4.5,
    ARRAY['C++', 'Distributed Systems', 'Go', 'System Design', 'Algorithms']::TEXT[],
    ARRAY['Software Development', 'Backend Development', 'System Design']::TEXT[],
    ARRAY['System Design (HLD & LLD)', 'Distributed Systems Architecture', 'Campus Placement Prep']::TEXT[],
    TRUE,
    TRUE,
    TRUE
)
ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    is_active = TRUE;
