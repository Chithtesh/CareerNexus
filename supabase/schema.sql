-- ==============================================================================
-- PLACEMENTCONNECT COMPREHENSIVE DATABASE SCHEMA & SECURITY POLICIES
-- Platform: Supabase PostgreSQL (Auth, Storage, Database, Realtime)
-- Product: PlacementConnect ("Connect. Prepare. Get Placed.")
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'alumni', 'admin', 'recruiter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE placement_status_type AS ENUM ('Not Placed', 'In Progress', 'Selected', 'Offer Accepted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status_type AS ENUM ('Applied', 'Shortlisted', 'Aptitude', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE storage_provider_type AS ENUM ('supabase', 'google_drive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_type_enum AS ENUM ('audio', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_status_enum AS ENUM ('ringing', 'accepted', 'rejected', 'ended', 'missed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bookmark_type_enum AS ENUM ('job', 'alumni', 'resource');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. DEPARTMENTS TABLE (Configurable Academic Departments)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- e.g. 'CSE', 'IT', 'AI&DS', 'ECE', 'EEE', 'MECH'
    name TEXT NOT NULL,        -- e.g. 'Computer Science & Engineering'
    head_of_department TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROGRAMS TABLE (Configurable Courses / Degree Programs)
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    code TEXT UNIQUE NOT NULL, -- e.g. 'BTECH-CSE', 'BTECH-IT', 'MTECH-AI', 'MCA'
    name TEXT NOT NULL,
    degree_level TEXT NOT NULL DEFAULT 'Undergraduate', -- 'Undergraduate', 'Postgraduate', 'Doctorate'
    duration_years INT NOT NULL DEFAULT 4,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BATCHES TABLE (Configurable Academic Batches & Graduation Years)
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- e.g. 'Batch 2023-2027', 'Batch 2024-2028'
    graduation_year INT NOT NULL, -- e.g. 2027
    start_year INT NOT NULL DEFAULT 2023,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. USERS TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Matches auth.users.id
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'deactivated', 'pending_activation'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    invited_at TIMESTAMPTZ DEFAULT NULL,
    activated_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    profile_photo TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    course TEXT DEFAULT 'B.Tech',
    batch TEXT DEFAULT '2023-2027',
    graduation_year INT NOT NULL DEFAULT 2027,
    roll_number TEXT UNIQUE NOT NULL DEFAULT '',
    cgpa NUMERIC(4,2) NOT NULL DEFAULT 7.50,
    tenth_percentage NUMERIC(5,2) DEFAULT 85.00,
    twelfth_percentage NUMERIC(5,2) DEFAULT 85.00,
    skills TEXT[] DEFAULT ARRAY['Java', 'Data Structures', 'SQL']::TEXT[],
    preferred_domain TEXT NOT NULL DEFAULT 'Software Development',
    bio TEXT DEFAULT '',
    github_url TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    portfolio_url TEXT DEFAULT '',
    resume_url TEXT DEFAULT '',
    resume_file_name TEXT DEFAULT '',
    placement_status placement_status_type NOT NULL DEFAULT 'Not Placed',
    placed_company TEXT DEFAULT '',
    placed_package TEXT DEFAULT '',
    profile_completion INT NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    projects JSONB DEFAULT '[]'::JSONB,
    certifications JSONB DEFAULT '[]'::JSONB,
    custom_fields JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_user UNIQUE (user_id)
);

-- 8. ALUMNI TABLE
CREATE TABLE IF NOT EXISTS public.alumni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    alumni_id TEXT UNIQUE DEFAULT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    profile_photo TEXT DEFAULT '',
    graduation_year INT NOT NULL DEFAULT 2023,
    department TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    company TEXT NOT NULL DEFAULT 'Tech Leader',
    company_id UUID DEFAULT NULL,
    company_logo TEXT DEFAULT '',
    designation TEXT NOT NULL DEFAULT 'Software Engineer',
    experience_years NUMERIC(3,1) NOT NULL DEFAULT 2.5,
    skills TEXT[] DEFAULT ARRAY['System Design', 'Cloud', 'Java']::TEXT[],
    preferred_domains TEXT[] DEFAULT ARRAY['Software Development']::TEXT[],
    bio TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    contact_preference TEXT DEFAULT 'Email & Chat',
    available_for_mentoring BOOLEAN NOT NULL DEFAULT TRUE,
    mentees_count INT NOT NULL DEFAULT 0,
    rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    custom_fields JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_alumni_user UNIQUE (user_id)
);

-- 9. COMPANIES TABLE
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

-- Foreign key for alumni company_id
ALTER TABLE public.alumni
    DROP CONSTRAINT IF EXISTS fk_alumni_company;
ALTER TABLE public.alumni
    ADD CONSTRAINT fk_alumni_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- 10. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL DEFAULT '',
    company_logo TEXT DEFAULT '',
    company_location TEXT DEFAULT '',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    responsibilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    requirements TEXT[] DEFAULT ARRAY[]::TEXT[],
    domain TEXT NOT NULL DEFAULT 'Software Development',
    location TEXT NOT NULL DEFAULT 'Bengaluru',
    employment_type TEXT NOT NULL DEFAULT 'Full Time',
    salary TEXT NOT NULL DEFAULT '₹18 - ₹24 LPA',
    eligibility TEXT NOT NULL DEFAULT 'B.Tech CSE/IT/ECE with minimum 7.0 CGPA',
    minimum_cgpa NUMERIC(4,2) NOT NULL DEFAULT 7.00,
    required_skills TEXT[] DEFAULT ARRAY['Java', 'DSA']::TEXT[],
    application_deadline TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Closed'
    vacancies INT DEFAULT 5,
    applicants_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL DEFAULT '',
    student_roll TEXT NOT NULL DEFAULT '',
    student_department TEXT NOT NULL DEFAULT '',
    student_cgpa NUMERIC(4,2) NOT NULL DEFAULT 7.00,
    student_email TEXT NOT NULL DEFAULT '',
    student_avatar TEXT DEFAULT '',
    student_resume_url TEXT DEFAULT '',
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL DEFAULT '',
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL DEFAULT '',
    company_logo TEXT DEFAULT '',
    salary TEXT NOT NULL DEFAULT '',
    status application_status_type NOT NULL DEFAULT 'Applied',
    notes TEXT DEFAULT 'Application submitted successfully. Under initial screening.',
    timeline JSONB DEFAULT '[]'::JSONB,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_job_application UNIQUE (student_id, job_id)
);

-- 12. RESOURCE FOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    is_global BOOLEAN NOT NULL DEFAULT TRUE,
    files_count INT NOT NULL DEFAULT 0,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. RESOURCE FILES TABLE
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.folders(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploader_name TEXT NOT NULL DEFAULT 'Placement Member',
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    storage_provider storage_provider_type NOT NULL DEFAULT 'supabase',
    external_file_id TEXT DEFAULT '',
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    size BIGINT NOT NULL DEFAULT 1048576,
    size_formatted TEXT NOT NULL DEFAULT '1.0 MB',
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'DSA',
    downloads_count INT NOT NULL DEFAULT 0,
    is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT NULL,
    last_message_text TEXT DEFAULT '',
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14.1 CONVERSATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_conversation_member UNIQUE(conversation_id, user_id)
);

-- 14.2 MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL DEFAULT '',
    message_type TEXT NOT NULL DEFAULT 'text',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    content TEXT DEFAULT '',
    sender_name TEXT NOT NULL DEFAULT '',
    sender_avatar TEXT DEFAULT '',
    sender_role TEXT NOT NULL DEFAULT 'student',
    attachment_name TEXT DEFAULT '',
    attachment_url TEXT DEFAULT '',
    attachment_size TEXT DEFAULT '',
    read_at TIMESTAMPTZ DEFAULT NULL
);

-- 15. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT DEFAULT '',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. CALLS TABLE (Signaling & Session Logs)
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    caller_name TEXT NOT NULL DEFAULT '',
    caller_avatar TEXT DEFAULT '',
    caller_role TEXT NOT NULL DEFAULT 'student',
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_name TEXT NOT NULL DEFAULT '',
    receiver_avatar TEXT DEFAULT '',
    receiver_role TEXT NOT NULL DEFAULT 'alumni',
    call_type call_type_enum NOT NULL DEFAULT 'video',
    status call_status_enum NOT NULL DEFAULT 'ringing',
    started_at TIMESTAMPTZ DEFAULT NULL,
    ended_at TIMESTAMPTZ DEFAULT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_type bookmark_type_enum NOT NULL,
    item_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_bookmark UNIQUE (user_id, item_type, item_id)
);

-- 18. ADMIN AUDIT LOGS TABLE
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

-- ==============================================================================
-- PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(is_active);
CREATE INDEX IF NOT EXISTS idx_programs_dept ON public.programs(department_id);
CREATE INDEX IF NOT EXISTS idx_batches_grad_year ON public.batches(graduation_year);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_dept_id ON public.students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON public.students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_active ON public.students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_placement ON public.students(placement_status);
CREATE INDEX IF NOT EXISTS idx_alumni_user ON public.alumni(user_id);
CREATE INDEX IF NOT EXISTS idx_alumni_active ON public.alumni(is_active);
CREATE INDEX IF NOT EXISTS idx_alumni_company ON public.alumni(company);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_student ON public.applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action, created_at DESC);

-- ==============================================================================
-- SECURITY HELPER FUNCTION (Prevents RLS Recursion & search_path secured)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
    SELECT role FROM public.users WHERE id = user_uuid LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public, auth, pg_temp;

-- ==============================================================================
-- AUTH TRIGGER FOR AUTOMATIC USER PROFILE PROVISIONING
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role;
    v_full_name TEXT;
    v_department TEXT;
BEGIN
    v_role := 'student'::user_role;
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_department := COALESCE(new.raw_user_meta_data->>'department', 'Computer Science & Engineering');

    -- 1. Insert into public.users
    INSERT INTO public.users (id, email, full_name, role, avatar_url, is_active, status, activated_at)
    VALUES (
        new.id,
        new.email,
        v_full_name,
        v_role,
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
        TRUE,
        'active',
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = TRUE,
        status = 'active',
        activated_at = COALESCE(public.users.activated_at, NOW()),
        updated_at = NOW();

    -- 2. If student, create student profile
    IF v_role = 'student' THEN
        INSERT INTO public.students (user_id, full_name, email, department, roll_number, profile_photo, is_active)
        VALUES (
            new.id,
            v_full_name,
            new.email,
            v_department,
            COALESCE(new.raw_user_meta_data->>'roll_number', '23' || SUBSTRING(v_department FROM 1 FOR 2) || LPAD(FLOOR(RANDOM()*899+100)::TEXT, 3, '0')),
            COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
            TRUE
        )
        ON CONFLICT (user_id) DO NOTHING;
    -- 3. If alumni, create alumni profile
    ELSIF v_role = 'alumni' THEN
        INSERT INTO public.alumni (user_id, full_name, email, department, company, designation, profile_photo, is_active)
        VALUES (
            new.id,
            v_full_name,
            new.email,
            v_department,
            COALESCE(new.raw_user_meta_data->>'company', 'Technology Partner'),
            COALESCE(new.raw_user_meta_data->>'designation', 'Software Engineer'),
            COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
            TRUE
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- Trigger binding
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Departments, Programs, Batches Policies
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Public read programs" ON public.programs FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage programs" ON public.programs FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Public read batches" ON public.batches FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage batches" ON public.batches FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- 2. Users Policies
CREATE POLICY "Users can read all profiles" ON public.users FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own record" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins full access to users" ON public.users FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- 3. Students Policies
CREATE POLICY "Anyone can view student profiles" ON public.students FOR SELECT USING (TRUE);
CREATE POLICY "Students can update own profile" ON public.students FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Students can insert own profile" ON public.students FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins full access to students" ON public.students FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- 4. Alumni Policies
CREATE POLICY "Anyone can view alumni profiles" ON public.alumni FOR SELECT USING (TRUE);
CREATE POLICY "Alumni can update own profile" ON public.alumni FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Alumni can insert own profile" ON public.alumni FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins full access to alumni" ON public.alumni FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- 5. Companies Policies
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage companies" ON public.companies FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- 6. Jobs Policies
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (TRUE);
CREATE POLICY "Admins manage jobs" ON public.jobs FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- 7. Applications Policies
CREATE POLICY "Students view own applications" ON public.applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = applications.student_id AND s.user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);
CREATE POLICY "Students submit applications" ON public.applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = applications.student_id AND s.user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);
CREATE POLICY "Admins update applications" ON public.applications FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'admin'
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = applications.student_id AND s.user_id = auth.uid())
);

-- 8. Resource Folders & Files
CREATE POLICY "Anyone can view folders" ON public.folders FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can view files" ON public.files FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create folders" ON public.folders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Folder creators and admins manage folders" ON public.folders FOR ALL USING (
    owner_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin'
);
CREATE POLICY "Authenticated users upload files" ON public.files FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "File uploaders and admins manage files" ON public.files FOR ALL USING (
    uploaded_by = auth.uid() OR public.get_user_role(auth.uid()) = 'admin'
);

-- 9. Messages Policies
CREATE POLICY "Users read own messages" ON public.messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

-- 10. Notifications Policies
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL USING (
    auth.uid() = user_id
);

-- 11. Calls Policies
CREATE POLICY "Participants manage calls" ON public.calls FOR ALL USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
);

-- 12. Bookmarks Policies
CREATE POLICY "Users manage own bookmarks" ON public.bookmarks FOR ALL USING (
    auth.uid() = user_id
);

-- 13. Audit Log Policies (Strictly restricted to admins)
CREATE POLICY "Admins read audit logs" ON public.admin_audit_logs FOR SELECT USING (
    public.get_user_role(auth.uid()) = 'admin'
);
CREATE POLICY "Admins insert audit logs" ON public.admin_audit_logs FOR INSERT WITH CHECK (
    public.get_user_role(auth.uid()) = 'admin'
);

-- Audit Identity Enforcement Trigger
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

-- ==============================================================================
-- STORAGE BUCKETS (Resumes, Resources, Avatars)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', TRUE) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resources', 'resources', TRUE) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public read resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
CREATE POLICY "Authenticated upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users update own resumes" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read resources" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
CREATE POLICY "Authenticated upload resources" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resources' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- ==============================================================================
-- REALTIME PUBLICATIONS FOR LIVE COLLABORATION
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_logs;

-- ==============================================================================
-- HARDENED STORED PROCEDURES & RPC FUNCTIONS
-- ==============================================================================

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

-- Graduate Student to Alumni RPC (Secured & Hardened)
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
    -- Mandatory Authorization Check
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL OR public.get_user_role(v_admin_id) <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only authenticated placement administrators can graduate students.';
    END IF;

    -- Fetch Student Record
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student record not found for ID: %', p_student_id;
    END IF;

    -- Resolve Admin Information from database
    SELECT full_name INTO v_admin_name FROM public.users WHERE id = v_admin_id;

    -- Calculate unique alumni identifier safely
    v_target_alumni_id := COALESCE(
        p_alumni_id,
        'ALUM-' || p_graduation_year || '-' || SUBSTRING(REPLACE(v_student.roll_number, ' ', '') FROM 1 FOR 6)
    );

    WHILE EXISTS (SELECT 1 FROM public.alumni WHERE alumni_id = v_target_alumni_id AND user_id <> v_student.user_id) LOOP
        v_dup_counter := v_dup_counter + 1;
        v_target_alumni_id := 'ALUM-' || p_graduation_year || '-' || SUBSTRING(REPLACE(v_student.roll_number, ' ', '') FROM 1 FOR 6) || '-' || v_dup_counter;
    END LOOP;

    -- Update User Role to alumni
    UPDATE public.users
    SET role = 'alumni', updated_at = NOW()
    WHERE id = v_student.user_id;

    -- Insert or Update Alumni record
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

    -- Update Student status without deleting history
    UPDATE public.students
    SET
        graduation_year = p_graduation_year,
        placement_status = CASE WHEN placement_status = 'Not Placed' THEN 'Selected' ELSE placement_status END,
        placed_company = COALESCE(p_company, placed_company),
        updated_at = NOW()
    WHERE id = p_student_id;

    -- Record in Audit Log
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

-- Admin Toggle User Deactivation RPC
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
    -- Mandatory Authorization Check
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL OR public.get_user_role(v_admin_id) <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only authenticated administrators can modify account activation status.';
    END IF;

    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found for ID: %', p_user_id;
    END IF;

    IF p_user_id = v_admin_id AND NOT p_is_active THEN
        RAISE EXCEPTION 'Action Blocked: You cannot deactivate your own administrative account.';
    END IF;

    SELECT full_name INTO v_admin_name FROM public.users WHERE id = v_admin_id;
    v_action := CASE WHEN p_is_active THEN 'REACTIVATE_USER' ELSE 'DEACTIVATE_USER' END;

    -- Update public.users
    UPDATE public.users
    SET
        is_active = p_is_active,
        status = CASE WHEN p_is_active THEN 'active' ELSE 'deactivated' END,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Update student record if exists
    UPDATE public.students
    SET is_active = p_is_active, updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Update alumni record if exists
    UPDATE public.alumni
    SET is_active = p_is_active, updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record in Audit Log
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

-- Strict Privilege Boundaries & Grants
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.check_user_duplicates(TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_user_duplicates(TEXT, TEXT, TEXT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.graduate_student_to_alumni(UUID, INT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.graduate_student_to_alumni(UUID, INT, TEXT, TEXT, TEXT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_toggle_user_status(UUID, BOOLEAN, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status(UUID, BOOLEAN, UUID, TEXT) TO authenticated;

-- ==============================================================================
-- 15. STUDENT PLACEMENT TASKS & ASSESSMENT REPOSITORY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.student_tasks (
    id TEXT PRIMARY KEY DEFAULT ('task-' || replace(gen_random_uuid()::text, '-', '')),
    student_id TEXT NOT NULL,
    company_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo TEXT,
    job_id TEXT NOT NULL,
    job_title TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Coding',
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Pending',
    due_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '3 days'),
    estimated_minutes INT DEFAULT 60,
    score NUMERIC(5,2),
    max_score NUMERIC(5,2) DEFAULT 100,
    completed_at TIMESTAMPTZ,
    submission_notes TEXT,
    resource_links JSONB DEFAULT '[]'::jsonb,
    required_skill_target TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_tasks_student_id ON public.student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_company_id ON public.student_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_job_id ON public.student_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON public.student_tasks(status);

ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "student_tasks_select_policy" ON public.student_tasks;
CREATE POLICY "student_tasks_select_policy"
ON public.student_tasks
FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "student_tasks_insert_policy" ON public.student_tasks;
CREATE POLICY "student_tasks_insert_policy"
ON public.student_tasks
FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "student_tasks_update_policy" ON public.student_tasks;
CREATE POLICY "student_tasks_update_policy"
ON public.student_tasks
FOR UPDATE
TO authenticated
USING (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
)
WITH CHECK (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "student_tasks_delete_policy" ON public.student_tasks;
CREATE POLICY "student_tasks_delete_policy"
ON public.student_tasks
FOR DELETE
TO authenticated
USING (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);
