-- ==============================================================================
-- CareerNexus — Student Placement Analysis & Company-Based Task Management Schema
-- Migration: 20261002_student_tasks_and_placement_analysis.sql
-- ==============================================================================

-- 1. CREATE STUDENT TASKS TABLE
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

-- 2. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_student_tasks_student_id ON public.student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_company_id ON public.student_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_job_id ON public.student_tasks(job_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON public.student_tasks(status);
CREATE INDEX IF NOT EXISTS idx_student_tasks_due_date ON public.student_tasks(due_date);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR STUDENT TASKS
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

-- 5. REALTIME REPLICATION (Safe addition)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'student_tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.student_tasks;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
