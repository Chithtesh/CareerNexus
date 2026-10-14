-- ==============================================================================
-- CareerNexus — Full Placement Platform Extension
-- Migration: 20261002_complete_placement_platform.sql
-- Modules: Assessment Attempts, Placement Events & Drives, Mock Interview Sessions
-- ==============================================================================

-- 1. ASSESSMENT ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id TEXT PRIMARY KEY DEFAULT ('att-' || replace(gen_random_uuid()::text, '-', '')),
    student_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL,
    assessment_title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'aptitude' | 'technical' | 'coding' | 'mock'
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    details JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON public.assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_category ON public.assessment_attempts(category);

ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assessment_attempts_select" ON public.assessment_attempts;
CREATE POLICY "assessment_attempts_select" ON public.assessment_attempts
FOR SELECT TO authenticated
USING (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) IN ('admin', 'recruiter')
);

DROP POLICY IF EXISTS "assessment_attempts_insert" ON public.assessment_attempts;
CREATE POLICY "assessment_attempts_insert" ON public.assessment_attempts
FOR INSERT TO authenticated
WITH CHECK (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);

-- 2. PLACEMENT EVENTS & DRIVES TABLE
CREATE TABLE IF NOT EXISTS public.placement_events (
    id TEXT PRIMARY KEY DEFAULT ('evt-' || replace(gen_random_uuid()::text, '-', '')),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    event_type TEXT NOT NULL, -- 'drive' | 'interview' | 'assessment' | 'workshop' | 'deadline'
    date DATE NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    eligible_branches JSONB DEFAULT '["All"]'::jsonb,
    min_cgpa NUMERIC(4,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Upcoming', -- 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled'
    job_id TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_events_date ON public.placement_events(date);
CREATE INDEX IF NOT EXISTS idx_placement_events_type ON public.placement_events(event_type);

ALTER TABLE public.placement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "placement_events_select" ON public.placement_events;
CREATE POLICY "placement_events_select" ON public.placement_events
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "placement_events_manage" ON public.placement_events;
CREATE POLICY "placement_events_manage" ON public.placement_events
FOR ALL TO authenticated
USING (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'))
WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'recruiter'));

-- 3. MOCK INTERVIEW SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.mock_interview_sessions (
    id TEXT PRIMARY KEY DEFAULT ('mock-' || replace(gen_random_uuid()::text, '-', '')),
    student_id TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Technical' | 'HR' | 'Behavioral' | 'Situational' | 'Project'
    target_role TEXT NOT NULL,
    target_company TEXT,
    total_score NUMERIC(5,2) DEFAULT 0,
    strengths JSONB DEFAULT '[]'::jsonb,
    improvements JSONB DEFAULT '[]'::jsonb,
    ai_feedback TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_data JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mock_interviews_student ON public.mock_interview_sessions(student_id);

ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mock_interviews_select" ON public.mock_interview_sessions;
CREATE POLICY "mock_interviews_select" ON public.mock_interview_sessions
FOR SELECT TO authenticated
USING (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "mock_interviews_insert" ON public.mock_interview_sessions;
CREATE POLICY "mock_interviews_insert" ON public.mock_interview_sessions
FOR INSERT TO authenticated
WITH CHECK (
    student_id = auth.uid()::TEXT
    OR student_id IN (SELECT id::TEXT FROM public.students WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'
);

-- 4. REALTIME ENABLEMENT
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'assessment_attempts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_attempts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'placement_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.placement_events;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
