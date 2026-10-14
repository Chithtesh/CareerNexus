-- ==============================================================================
-- CareerNexus — Complete Placement Drive Management Schema
-- Migration: 20261007_placement_drives_management.sql
-- Modules: Placement Drives, Drive Rounds, Round Results, Interview Slots, Drive Offers
-- ==============================================================================

-- 1. ENUMS FOR PLACEMENT DRIVES
DO $$ BEGIN
    CREATE TYPE drive_status_type AS ENUM (
        'Draft', 'Published', 'Applications Open', 'Applications Closed', 
        'Screening', 'In Progress', 'Technical', 'HR', 'Offers Released', 'Completed', 'Cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE drive_round_type AS ENUM (
        'Screening', 'Aptitude Test', 'Coding Assessment', 'Technical Interview', 
        'Group Discussion', 'HR Interview', 'Managerial Interview', 'Final Round'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE round_result_status AS ENUM (
        'Pending', 'Shortlisted', 'Cleared', 'Rejected', 'Waitlisted', 'Absent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE slot_status_type AS ENUM (
        'Available', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_status_type AS ENUM (
        'Offered', 'Accepted', 'Declined', 'Expired', 'Revoked'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PLACEMENT DRIVES TABLE
CREATE TABLE IF NOT EXISTS public.placement_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    company_logo TEXT DEFAULT '',
    title TEXT NOT NULL,
    role_designation TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    eligible_departments TEXT[] NOT NULL DEFAULT ARRAY['Computer Science & Engineering', 'Information Technology']::TEXT[],
    minimum_cgpa NUMERIC(4,2) NOT NULL DEFAULT 6.50,
    max_backlogs INT NOT NULL DEFAULT 0,
    required_skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    application_deadline TIMESTAMPTZ NOT NULL,
    drive_date TIMESTAMPTZ NOT NULL,
    mode TEXT NOT NULL DEFAULT 'Online', -- 'Online', 'On-Campus', 'Hybrid'
    venue TEXT NOT NULL DEFAULT 'Placement Auditorium / Virtual Room',
    salary_ctc TEXT NOT NULL DEFAULT '₹12 - ₹18 LPA',
    status drive_status_type NOT NULL DEFAULT 'Published',
    current_round_number INT NOT NULL DEFAULT 1,
    total_rounds INT NOT NULL DEFAULT 3,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_drives_company ON public.placement_drives(company_id);
CREATE INDEX IF NOT EXISTS idx_placement_drives_status ON public.placement_drives(status);
CREATE INDEX IF NOT EXISTS idx_placement_drives_date ON public.placement_drives(drive_date);

-- 3. DRIVE ROUNDS TABLE
CREATE TABLE IF NOT EXISTS public.drive_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
    round_order INT NOT NULL DEFAULT 1,
    round_name TEXT NOT NULL,
    round_type drive_round_type NOT NULL DEFAULT 'Aptitude Test',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 60,
    description TEXT DEFAULT '',
    venue_or_link TEXT DEFAULT 'Google Meet / Lab 3',
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'In Progress', 'Completed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_drive_round_order UNIQUE (drive_id, round_order)
);

CREATE INDEX IF NOT EXISTS idx_drive_rounds_drive ON public.drive_rounds(drive_id);

-- 4. ROUND RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.drive_round_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.drive_rounds(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL DEFAULT '',
    student_roll TEXT NOT NULL DEFAULT '',
    student_department TEXT NOT NULL DEFAULT '',
    score NUMERIC(5,2) DEFAULT NULL,
    max_score NUMERIC(5,2) DEFAULT 100,
    status round_result_status NOT NULL DEFAULT 'Pending',
    feedback TEXT DEFAULT '',
    interviewer_notes TEXT DEFAULT '',
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_round_student_result UNIQUE (round_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_round_results_round ON public.drive_round_results(round_id);
CREATE INDEX IF NOT EXISTS idx_round_results_student ON public.drive_round_results(student_id);

-- 5. INTERVIEW SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.interview_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
    round_id UUID REFERENCES public.drive_rounds(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    student_name TEXT DEFAULT '',
    student_roll TEXT DEFAULT '',
    interviewer_name TEXT NOT NULL DEFAULT 'Technical Panel 1',
    interviewer_email TEXT DEFAULT '',
    slot_date DATE NOT NULL,
    start_time TEXT NOT NULL, -- e.g. '10:00 AM'
    end_time TEXT NOT NULL,   -- e.g. '10:45 AM'
    meeting_link TEXT DEFAULT '',
    venue TEXT DEFAULT 'Virtual / Google Meet',
    status slot_status_type NOT NULL DEFAULT 'Scheduled',
    feedback TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_slots_drive ON public.interview_slots(drive_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_student ON public.interview_slots(student_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_date ON public.interview_slots(slot_date);

-- 6. DRIVE OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.drive_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drive_id UUID NOT NULL REFERENCES public.placement_drives(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL DEFAULT '',
    company_name TEXT NOT NULL,
    role_designation TEXT NOT NULL,
    ctc_package TEXT NOT NULL, -- e.g. '₹18 LPA'
    base_salary TEXT DEFAULT '',
    joining_date DATE,
    offer_letter_url TEXT DEFAULT '',
    status offer_status_type NOT NULL DEFAULT 'Offered',
    acceptance_deadline TIMESTAMPTZ,
    student_response_at TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_drive_student_offer UNIQUE (drive_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_drive_offers_drive ON public.drive_offers(drive_id);
CREATE INDEX IF NOT EXISTS idx_drive_offers_student ON public.drive_offers(student_id);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.placement_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_round_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_offers ENABLE ROW LEVEL SECURITY;

-- 8. SECURITY POLICIES
-- Placement Drives: Viewable by authenticated users, manageable by Admin & Recruiter
CREATE POLICY "placement_drives_read" ON public.placement_drives
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "placement_drives_write" ON public.placement_drives
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'));

-- Drive Rounds: Viewable by all, manageable by Admin & Recruiter
CREATE POLICY "drive_rounds_read" ON public.drive_rounds
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "drive_rounds_write" ON public.drive_rounds
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'));

-- Round Results: Students see their own; Admin & Recruiter see all
CREATE POLICY "drive_round_results_read" ON public.drive_round_results
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() 
        OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.get_user_role(auth.uid()) IN ('admin', 'recruiter')
    );

CREATE POLICY "drive_round_results_write" ON public.drive_round_results
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'));

-- Interview Slots: Students see their own; Admin & Recruiter see all
CREATE POLICY "interview_slots_read" ON public.interview_slots
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() 
        OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.get_user_role(auth.uid()) IN ('admin', 'recruiter')
    );

CREATE POLICY "interview_slots_write" ON public.interview_slots
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'))
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'));

-- Drive Offers: Students see own offers & can update response; Admin & Recruiter manage
CREATE POLICY "drive_offers_read" ON public.drive_offers
    FOR SELECT TO authenticated
    USING (
        student_id = auth.uid() 
        OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.get_user_role(auth.uid()) IN ('admin', 'recruiter')
    );

CREATE POLICY "drive_offers_update_student" ON public.drive_offers
    FOR UPDATE TO authenticated
    USING (
        student_id = auth.uid() 
        OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        OR public.get_user_role(auth.uid()) IN ('admin', 'recruiter')
    );

CREATE POLICY "drive_offers_write_admin" ON public.drive_offers
    FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'));
