-- ==============================================================================
-- CAREERNEXUS SECURE MIGRATION: Organization Schema, Admin Management, & Audit Logs
-- Migration: 20261002_admin_management_and_org_schema
-- Target Platform: Supabase PostgreSQL (Auth, Database, Storage, Realtime)
-- Description: Hardened, production-ready schema migration with safe upgrade paths,
--              audit log immutability, self-elevation defense, enumeration prevention,
--              duplicate pre-checking, bootstrap tooling, and strict search_path isolation.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS & PREREQUISITES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure user_role enum exists safely without breaking if already present
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'alumni', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. SAFE get_user_role() UPGRADE PATH
-- ------------------------------------------------------------------------------
-- Handles any return type transition safely without breaking existing RLS dependencies
DO $$
DECLARE
    v_current_ret_type TEXT;
BEGIN
    SELECT t.typname INTO v_current_ret_type
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_type t ON p.prorettype = t.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_user_role'
    LIMIT 1;

    -- If existing function return type is incompatible with TEXT, drop dependent policies and old function safely
    IF v_current_ret_type IS NOT NULL AND v_current_ret_type <> 'text' THEN
        DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
        DROP POLICY IF EXISTS "Admins manage programs" ON public.programs;
        DROP POLICY IF EXISTS "Admins manage batches" ON public.batches;
        DROP POLICY IF EXISTS "Admins full access to users" ON public.users;
        DROP POLICY IF EXISTS "Admins full access to students" ON public.students;
        DROP POLICY IF EXISTS "Admins full access to alumni" ON public.alumni;
        DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
        DROP POLICY IF EXISTS "Admins manage jobs" ON public.jobs;
        DROP POLICY IF EXISTS "Students view own applications" ON public.applications;
        DROP POLICY IF EXISTS "Students submit applications" ON public.applications;
        DROP POLICY IF EXISTS "Admins update applications" ON public.applications;
        DROP POLICY IF EXISTS "Folder creators and admins manage folders" ON public.folders;
        DROP POLICY IF EXISTS "File uploaders and admins manage files" ON public.files;
        DROP POLICY IF EXISTS "Admins read audit logs" ON public.admin_audit_logs;
        DROP POLICY IF EXISTS "Admins insert audit logs" ON public.admin_audit_logs;
        
        DROP FUNCTION IF EXISTS public.get_user_role(UUID);
    END IF;
END $$;

-- Create/Replace standardized get_user_role function (returning TEXT for 100% compatibility)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
    SELECT role::TEXT FROM public.users WHERE id = user_uuid LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public, auth, pg_temp;

-- ------------------------------------------------------------------------------
-- 3. ORGANIZATIONAL ENTITIES (Departments, Programs, Batches)
-- ------------------------------------------------------------------------------

-- Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    head_of_department TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Programs / Courses Table
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    degree_level TEXT NOT NULL DEFAULT 'Undergraduate',
    duration_years INT NOT NULL DEFAULT 4,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Academic Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    graduation_year INT NOT NULL,
    start_year INT NOT NULL DEFAULT 2023,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. PREREQUISITE CORE TABLES & EXTENSIONS (Safe Reruns & Constraint Pre-Checks)
-- ------------------------------------------------------------------------------

-- Ensure public.companies exists for foreign key references
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo TEXT DEFAULT '',
    website TEXT DEFAULT '',
    description TEXT DEFAULT '',
    industry TEXT NOT NULL DEFAULT 'Technology',
    location TEXT NOT NULL DEFAULT 'Bengaluru, India',
    tier TEXT NOT NULL DEFAULT 'Super Dream (Tier 1)',
    active_jobs_count INT NOT NULL DEFAULT 1,
    placed_students_count INT NOT NULL DEFAULT 5,
    average_package TEXT NOT NULL DEFAULT '₹24 LPA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extend public.users safely
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ DEFAULT NULL;

-- Extend public.students safely
ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS course TEXT DEFAULT 'B.Tech',
    ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT '2023-2027',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;

-- Ensure unique roll number constraint safely with duplicate pre-check
DO $$
DECLARE
    v_dup_roll_count INT;
BEGIN
    SELECT COUNT(*) INTO v_dup_roll_count FROM (
        SELECT roll_number FROM public.students 
        WHERE roll_number IS NOT NULL AND TRIM(roll_number) <> '' 
        GROUP BY roll_number HAVING COUNT(*) > 1
    ) dups;

    IF v_dup_roll_count > 0 THEN
        RAISE WARNING 'CareerNexus Migration Warning: Found % duplicated roll_number values in public.students. unique_student_roll_number constraint skipped until duplicates are resolved.', v_dup_roll_count;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_roll_number') THEN
            ALTER TABLE public.students ADD CONSTRAINT unique_student_roll_number UNIQUE (roll_number);
        END IF;
    END IF;
END $$;

-- Ensure unique student user constraint with duplicate pre-check
DO $$
DECLARE
    v_dup_student_user_count INT;
BEGIN
    SELECT COUNT(*) INTO v_dup_student_user_count FROM (
        SELECT user_id FROM public.students 
        WHERE user_id IS NOT NULL 
        GROUP BY user_id HAVING COUNT(*) > 1
    ) dups;

    IF v_dup_student_user_count > 0 THEN
        RAISE WARNING 'CareerNexus Migration Warning: Found % duplicated user_id values in public.students. unique_student_user constraint skipped until duplicates are resolved.', v_dup_student_user_count;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_student_user') THEN
            ALTER TABLE public.students ADD CONSTRAINT unique_student_user UNIQUE (user_id);
        END IF;
    END IF;
END $$;

-- Extend public.alumni safely
ALTER TABLE public.alumni
    ADD COLUMN IF NOT EXISTS alumni_id TEXT UNIQUE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS contact_preference TEXT DEFAULT 'Email & Chat',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;

-- Ensure unique alumni user constraint with duplicate pre-check
DO $$
DECLARE
    v_dup_alumni_user_count INT;
BEGIN
    SELECT COUNT(*) INTO v_dup_alumni_user_count FROM (
        SELECT user_id FROM public.alumni 
        WHERE user_id IS NOT NULL 
        GROUP BY user_id HAVING COUNT(*) > 1
    ) dups;

    IF v_dup_alumni_user_count > 0 THEN
        RAISE WARNING 'CareerNexus Migration Warning: Found % duplicated user_id values in public.alumni. unique_alumni_user constraint skipped until duplicates are resolved.', v_dup_alumni_user_count;
    ELSE
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_alumni_user') THEN
            ALTER TABLE public.alumni ADD CONSTRAINT unique_alumni_user UNIQUE (user_id);
        END IF;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. ADMIN AUDIT LOGS TABLE & IMMUTABILITY ENFORCEMENT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_name TEXT NOT NULL DEFAULT 'Placement Administrator',
    admin_email TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL DEFAULT '',
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. PERFORMANCE & SEARCH INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);
CREATE INDEX IF NOT EXISTS idx_programs_dept ON public.programs(department_id);
CREATE INDEX IF NOT EXISTS idx_batches_grad_year ON public.batches(graduation_year);
CREATE INDEX IF NOT EXISTS idx_students_dept_id ON public.students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON public.students(is_active);
CREATE INDEX IF NOT EXISTS idx_alumni_active ON public.alumni(is_active);
CREATE INDEX IF NOT EXISTS idx_alumni_company_id ON public.alumni(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);

-- ------------------------------------------------------------------------------
-- 7. AUDIT LOG & ROLE PROTECTION TRIGGERS (search_path secured)
-- ------------------------------------------------------------------------------

-- Enforce Audit Log Identity (Derives admin identity from auth.uid() automatically; falls back to system context)
CREATE OR REPLACE FUNCTION public.enforce_audit_log_identity()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_id UUID;
    v_admin_name TEXT;
    v_admin_email TEXT;
BEGIN
    v_caller_id := auth.uid();
    
    IF v_caller_id IS NOT NULL THEN
        NEW.admin_id := v_caller_id;
        SELECT full_name, email INTO v_admin_name, v_admin_email
        FROM public.users WHERE id = v_caller_id;
        
        NEW.admin_name := COALESCE(v_admin_name, 'Placement Administrator');
        NEW.admin_email := COALESCE(v_admin_email, '');
    ELSE
        -- Fallback for backend service-role executions
        IF NEW.admin_id IS NOT NULL THEN
            SELECT full_name, email INTO v_admin_name, v_admin_email
            FROM public.users WHERE id = NEW.admin_id;
            NEW.admin_name := COALESCE(v_admin_name, NEW.admin_name, 'System Administrator');
            NEW.admin_email := COALESCE(v_admin_email, NEW.admin_email, '');
        ELSE
            NEW.admin_name := COALESCE(NEW.admin_name, 'System Administrator');
            NEW.admin_email := COALESCE(NEW.admin_email, 'system@careernexus.local');
        END IF;
    END IF;
    
    NEW.created_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_audit_log_identity ON public.admin_audit_logs;
CREATE TRIGGER trg_enforce_audit_log_identity
    BEFORE INSERT ON public.admin_audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.enforce_audit_log_identity();

-- Audit Log Immutability: Prevent UPDATE or DELETE on audit logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Violation: Audit logs are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_mutation ON public.admin_audit_logs;
CREATE TRIGGER trg_prevent_audit_log_mutation
    BEFORE UPDATE OR DELETE ON public.admin_audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- Protect User Role and Status from Self-Elevation (INSERT & UPDATE)
CREATE OR REPLACE FUNCTION public.protect_user_role_and_status()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.role::TEXT = 'admin' THEN
            IF (auth.uid() IS NULL OR public.get_user_role(auth.uid()) <> 'admin') THEN
                NEW.role := 'student';
            END IF;
        END IF;
        IF NEW.is_active IS NULL THEN
            NEW.is_active := TRUE;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (NEW.role::TEXT IS DISTINCT FROM OLD.role::TEXT 
            OR NEW.is_active IS DISTINCT FROM OLD.is_active 
            OR NEW.status IS DISTINCT FROM OLD.status) THEN
            IF (auth.uid() IS NULL OR public.get_user_role(auth.uid()) <> 'admin') THEN
                RAISE EXCEPTION 'Unauthorized: Only administrators can modify roles, account activation, or status.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_user_role_and_status ON public.users;
CREATE TRIGGER trg_protect_user_role_and_status
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.protect_user_role_and_status();

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Department Policies
DROP POLICY IF EXISTS "Public read departments" ON public.departments;
DROP POLICY IF EXISTS "Admins manage departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Program Policies
DROP POLICY IF EXISTS "Public read programs" ON public.programs;
DROP POLICY IF EXISTS "Admins manage programs" ON public.programs;
CREATE POLICY "Public read programs" ON public.programs FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage programs" ON public.programs FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Batch Policies
DROP POLICY IF EXISTS "Public read batches" ON public.batches;
DROP POLICY IF EXISTS "Admins manage batches" ON public.batches;
CREATE POLICY "Public read batches" ON public.batches FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage batches" ON public.batches FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Audit Log Policies (Append-only for admins; read-only for admins)
DROP POLICY IF EXISTS "Admins read audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- ------------------------------------------------------------------------------
-- 9. HARDENED STORED PROCEDURES / RPC FUNCTIONS
-- ------------------------------------------------------------------------------

-- Duplicate Check RPC (Anti-Enumeration Guard: Admin only or own record check)
CREATE OR REPLACE FUNCTION public.check_user_duplicates(
    p_email TEXT,
    p_roll_number TEXT DEFAULT NULL,
    p_alumni_id TEXT DEFAULT NULL,
    p_exclude_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_email_exists BOOLEAN := FALSE;
    v_roll_exists BOOLEAN := FALSE;
    v_alumni_id_exists BOOLEAN := FALSE;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    v_caller_role := public.get_user_role(v_caller_id);

    -- Anti-Enumeration Guard: Non-admins can only check conflicts against their own user account
    IF v_caller_role <> 'admin' THEN
        IF p_exclude_user_id IS NULL OR p_exclude_user_id <> v_caller_id THEN
            RAISE EXCEPTION 'Unauthorized: Global user duplicate checking is restricted to administrators.';
        END IF;
    END IF;

    -- Check Email in public.users
    IF p_email IS NOT NULL AND TRIM(p_email) <> '' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.users
            WHERE LOWER(email) = LOWER(TRIM(p_email))
            AND (p_exclude_user_id IS NULL OR id <> p_exclude_user_id)
        ) INTO v_email_exists;
    END IF;

    -- Check Roll Number in public.students
    IF p_roll_number IS NOT NULL AND TRIM(p_roll_number) <> '' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.students
            WHERE LOWER(roll_number) = LOWER(TRIM(p_roll_number))
            AND (p_exclude_user_id IS NULL OR user_id <> p_exclude_user_id)
        ) INTO v_roll_exists;
    END IF;

    -- Check Alumni ID in public.alumni
    IF p_alumni_id IS NOT NULL AND TRIM(p_alumni_id) <> '' THEN
        SELECT EXISTS(
            SELECT 1 FROM public.alumni
            WHERE LOWER(alumni_id) = LOWER(TRIM(p_alumni_id))
            AND (p_exclude_user_id IS NULL OR user_id <> p_exclude_user_id)
        ) INTO v_alumni_id_exists;
    END IF;

    RETURN jsonb_build_object(
        'emailExists', v_email_exists,
        'rollNumberExists', v_roll_exists,
        'alumniIdExists', v_alumni_id_exists,
        'hasDuplicate', (v_email_exists OR v_roll_exists OR v_alumni_id_exists)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, auth, pg_temp;

-- Graduate Student to Alumni RPC (Secured & Hardened against ID collisions and spoofing)
CREATE OR REPLACE FUNCTION public.graduate_student_to_alumni(
    p_student_id UUID,
    p_graduation_year INT,
    p_company TEXT DEFAULT 'Technology Company',
    p_designation TEXT DEFAULT 'Software Engineer',
    p_alumni_id TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_admin_id UUID;
    v_admin_name TEXT := 'Placement Administrator';
    v_student RECORD;
    v_new_alumni_id UUID;
    v_target_alumni_id TEXT;
    v_dup_counter INT := 0;
BEGIN
    -- 1. Derive and verify acting admin from authenticated session
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL OR public.get_user_role(v_admin_id) <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only authenticated placement administrators can graduate students.';
    END IF;

    -- 2. Fetch Student Record
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student record not found for ID: %', p_student_id;
    END IF;

    -- 3. Resolve Admin Information from database (ignores client-passed p_admin_id)
    SELECT full_name INTO v_admin_name FROM public.users WHERE id = v_admin_id;

    -- 4. Calculate unique alumni identifier safely
    v_target_alumni_id := COALESCE(
        p_alumni_id,
        'ALUM-' || p_graduation_year || '-' || SUBSTRING(REPLACE(v_student.roll_number, ' ', '') FROM 1 FOR 6)
    );

    -- Ensure generated alumni_id does not collide with existing records
    WHILE EXISTS (SELECT 1 FROM public.alumni WHERE alumni_id = v_target_alumni_id AND user_id <> v_student.user_id) LOOP
        v_dup_counter := v_dup_counter + 1;
        v_target_alumni_id := 'ALUM-' || p_graduation_year || '-' || SUBSTRING(REPLACE(v_student.roll_number, ' ', '') FROM 1 FOR 6) || '-' || v_dup_counter;
    END LOOP;

    -- 5. Update User Role to alumni
    UPDATE public.users
    SET role = 'alumni', updated_at = NOW()
    WHERE id = v_student.user_id;

    -- 6. Insert or Update Alumni record (Preserves single user identity)
    INSERT INTO public.alumni (
        user_id,
        alumni_id,
        full_name,
        email,
        profile_photo,
        graduation_year,
        department,
        department_id,
        company,
        designation,
        skills,
        linkedin_url,
        available_for_mentoring,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        v_student.user_id,
        v_target_alumni_id,
        v_student.full_name,
        v_student.email,
        v_student.profile_photo,
        p_graduation_year,
        v_student.department,
        v_student.department_id,
        COALESCE(p_company, v_student.placed_company, 'Leading Tech Firm'),
        COALESCE(p_designation, 'Graduate Engineer'),
        v_student.skills,
        v_student.linkedin_url,
        TRUE,
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        alumni_id = EXCLUDED.alumni_id,
        graduation_year = EXCLUDED.graduation_year,
        company = EXCLUDED.company,
        designation = EXCLUDED.designation,
        is_active = TRUE,
        updated_at = NOW()
    RETURNING id INTO v_new_alumni_id;

    -- 7. Update Student status without deleting application history
    UPDATE public.students
    SET
        graduation_year = p_graduation_year,
        placement_status = CASE WHEN placement_status = 'Not Placed' THEN 'Selected' ELSE placement_status END,
        placed_company = COALESCE(p_company, placed_company),
        updated_at = NOW()
    WHERE id = p_student_id;

    -- 8. Record in Audit Log
    INSERT INTO public.admin_audit_logs (
        admin_id,
        admin_name,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_admin_id,
        COALESCE(v_admin_name, 'Placement Administrator'),
        'GRADUATE_STUDENT',
        'student',
        p_student_id::TEXT,
        jsonb_build_object(
            'student_name', v_student.full_name,
            'roll_number', v_student.roll_number,
            'graduation_year', p_graduation_year,
            'company', p_company,
            'designation', p_designation,
            'alumni_id', v_target_alumni_id,
            'alumni_record_id', v_new_alumni_id
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'studentId', p_student_id,
        'alumniId', v_new_alumni_id,
        'message', 'Student successfully graduated and alumni profile created.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- Admin Toggle User Deactivation RPC (Secured & Hardened)
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(
    p_user_id UUID,
    p_is_active BOOLEAN,
    p_admin_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_admin_id UUID;
    v_admin_name TEXT := 'Placement Administrator';
    v_user RECORD;
    v_action TEXT;
BEGIN
    -- 1. Derive and verify acting admin from authenticated session
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL OR public.get_user_role(v_admin_id) <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only authenticated administrators can modify account activation status.';
    END IF;

    -- 2. Fetch User Record
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found for ID: %', p_user_id;
    END IF;

    -- Self-deactivation lockout protection
    IF p_user_id = v_admin_id AND NOT p_is_active THEN
        RAISE EXCEPTION 'Action Blocked: You cannot deactivate your own administrative account.';
    END IF;

    SELECT full_name INTO v_admin_name FROM public.users WHERE id = v_admin_id;
    v_action := CASE WHEN p_is_active THEN 'REACTIVATE_USER' ELSE 'DEACTIVATE_USER' END;

    -- 3. Update public.users
    UPDATE public.users
    SET
        is_active = p_is_active,
        status = CASE WHEN p_is_active THEN 'active' ELSE 'deactivated' END,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- 4. Update student record if exists (Preserves historical applications)
    UPDATE public.students
    SET is_active = p_is_active, updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 5. Update alumni record if exists
    UPDATE public.alumni
    SET is_active = p_is_active, updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 6. Record in Audit Log
    INSERT INTO public.admin_audit_logs (
        admin_id,
        admin_name,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_admin_id,
        COALESCE(v_admin_name, 'Placement Administrator'),
        v_action,
        'user',
        p_user_id::TEXT,
        jsonb_build_object(
            'email', v_user.email,
            'full_name', v_user.full_name,
            'role', v_user.role,
            'is_active', p_is_active,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'userId', p_user_id,
        'isActive', p_is_active,
        'message', 'User account status updated successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- ------------------------------------------------------------------------------
-- 10. ADMINISTRATIVE BOOTSTRAP & INITIAL PROVISIONING HELPER
-- ------------------------------------------------------------------------------
-- Enables the initial administrator to be safely designated without self-elevation vulnerabilities
CREATE OR REPLACE FUNCTION public.bootstrap_initial_admin(
    p_user_email TEXT,
    p_admin_full_name TEXT DEFAULT 'Placement Officer'
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_existing_admin_count INT;
BEGIN
    -- Safety guard: Only allowed if no active admin exists, OR if caller is already an admin
    SELECT COUNT(*) INTO v_existing_admin_count FROM public.users WHERE role::TEXT = 'admin' AND is_active = TRUE;
    
    IF v_existing_admin_count > 0 THEN
        IF auth.uid() IS NULL OR public.get_user_role(auth.uid()) <> 'admin' THEN
            RAISE EXCEPTION 'Unauthorized: Administrators already exist. Only an existing active administrator can grant admin privileges.';
        END IF;
    END IF;

    SELECT id INTO v_user_id FROM public.users WHERE LOWER(email) = LOWER(TRIM(p_user_email));
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in public.users. Ensure the user exists before bootstrapping.', p_user_email;
    END IF;

    UPDATE public.users
    SET 
        role = 'admin',
        full_name = COALESCE(NULLIF(TRIM(p_admin_full_name), ''), full_name),
        status = 'active',
        is_active = TRUE,
        updated_at = NOW()
    WHERE id = v_user_id;

    INSERT INTO public.admin_audit_logs (
        admin_id,
        admin_name,
        admin_email,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_user_id,
        COALESCE(p_admin_full_name, 'Initial Bootstrap Admin'),
        p_user_email,
        'BOOTSTRAP_ADMIN',
        'user',
        v_user_id::TEXT,
        jsonb_build_object(
            'email', p_user_email,
            'bootstrapped_at', NOW()
        )
    );

    RETURN 'User ' || p_user_email || ' successfully elevated to Administrator.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- ------------------------------------------------------------------------------
-- 11. STRICT PRIVILEGE BOUNDARIES & GRANTS
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.check_user_duplicates(TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_user_duplicates(TEXT, TEXT, TEXT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.graduate_student_to_alumni(UUID, INT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.graduate_student_to_alumni(UUID, INT, TEXT, TEXT, TEXT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_toggle_user_status(UUID, BOOLEAN, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status(UUID, BOOLEAN, UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.bootstrap_initial_admin(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_initial_admin(TEXT, TEXT) TO authenticated;
