-- ==============================================================================
-- CareerNexus - Hybrid Resources & Bookmarks Migration
-- Migration: 20261007_hybrid_resources_and_bookmarks.sql
-- ==============================================================================

-- 1. EXTEND PUBLIC.FILES WITH HYBRID RESOURCE METADATA
ALTER TABLE public.files
    ADD COLUMN IF NOT EXISTS subtopic TEXT NOT NULL DEFAULT 'Core Concepts',
    ADD COLUMN IF NOT EXISTS resource_type TEXT NOT NULL DEFAULT 'PDF',
    ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'Internal',
    ADD COLUMN IF NOT EXISTS storage_type TEXT NOT NULL DEFAULT 'storage',
    ADD COLUMN IF NOT EXISTS external_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS file_name TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'pdf',
    ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 1048576;

-- Backfill default values for existing rows
UPDATE public.files 
SET 
    storage_type = CASE 
        WHEN (file_path IS NULL OR file_path = '') AND file_url LIKE 'http%' THEN 'external' 
        ELSE 'storage' 
    END,
    external_url = CASE 
        WHEN (file_path IS NULL OR file_path = '') AND file_url LIKE 'http%' THEN file_url 
        ELSE '' 
    END,
    subtopic = COALESCE(NULLIF(subtopic, ''), 'General Preparation'),
    resource_type = COALESCE(NULLIF(resource_type, ''), 'PDF'),
    provider = COALESCE(NULLIF(provider, ''), 'Internal'),
    is_active = TRUE
WHERE storage_type IS NULL OR storage_type = '';

-- 2. CREATE RESOURCE_BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.resource_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_resource_bookmark UNIQUE (user_id, resource_id)
);

-- 3. INDEXES FOR HIGH-EFFICIENCY SEARCH AND FILTERING
CREATE INDEX IF NOT EXISTS idx_files_subtopic ON public.files(subtopic);
CREATE INDEX IF NOT EXISTS idx_files_resource_type ON public.files(resource_type);
CREATE INDEX IF NOT EXISTS idx_files_provider ON public.files(provider);
CREATE INDEX IF NOT EXISTS idx_files_storage_type ON public.files(storage_type);
CREATE INDEX IF NOT EXISTS idx_files_is_active ON public.files(is_active);
CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_user ON public.resource_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_resource ON public.resource_bookmarks(resource_id);

-- 4. RLS POLICIES FOR RESOURCE_BOOKMARKS
ALTER TABLE public.resource_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own resource bookmarks" ON public.resource_bookmarks;
CREATE POLICY "Users can view own resource bookmarks"
    ON public.resource_bookmarks FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can add own resource bookmarks" ON public.resource_bookmarks;
CREATE POLICY "Users can add own resource bookmarks"
    ON public.resource_bookmarks FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own resource bookmarks" ON public.resource_bookmarks;
CREATE POLICY "Users can delete own resource bookmarks"
    ON public.resource_bookmarks FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- 5. REVISE RLS FOR PUBLIC.FILES (STUDENTS ONLY VIEW ACTIVE RESOURCES)
DROP POLICY IF EXISTS "Anyone can read resource files" ON public.files;
CREATE POLICY "Anyone can read resource files"
    ON public.files FOR SELECT
    TO authenticated
    USING (
        (is_active = TRUE AND is_private = FALSE) OR
        uploaded_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
