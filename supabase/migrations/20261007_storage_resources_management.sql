-- ==============================================================================
-- CareerNexus - Supabase Storage & Resource Repository Schema
-- Migration: 20261007_storage_resources_management.sql
-- ==============================================================================

-- 1. FOLDERS TABLE
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    parent_folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_global BOOLEAN NOT NULL DEFAULT TRUE,
    files_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. FILES / RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    title TEXT,
    file_path TEXT NOT NULL DEFAULT '',
    file_url TEXT NOT NULL DEFAULT '',
    bucket_name TEXT NOT NULL DEFAULT 'resources',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    storage_provider TEXT NOT NULL DEFAULT 'supabase',
    external_file_id TEXT,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    size BIGINT NOT NULL DEFAULT 0,
    size_formatted TEXT DEFAULT '1.0 MB',
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'General',
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploader_name TEXT NOT NULL DEFAULT 'Placement Member',
    downloads_count INT NOT NULL DEFAULT 0,
    is_bookmarked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_folders_category ON public.folders(category);
CREATE INDEX IF NOT EXISTS idx_folders_owner ON public.folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON public.files(category);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_bucket ON public.files(bucket_name, file_path);

-- 4. STORAGE BUCKET INITIALIZATION (resources)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resources',
    'resources',
    TRUE,
    52428800, -- 50 MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/csv',
        'text/plain',
        'application/zip',
        'application/x-zip-compressed',
        'image/png',
        'image/jpeg'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- 5. ROW LEVEL SECURITY (RLS) FOR PUBLIC.FOLDERS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view global folders" ON public.folders;
CREATE POLICY "Anyone can view global folders"
    ON public.folders FOR SELECT
    TO authenticated
    USING (is_global = TRUE OR owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

DROP POLICY IF EXISTS "Authenticated users create folders" ON public.folders;
CREATE POLICY "Authenticated users create folders"
    ON public.folders FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins and owners manage folders" ON public.folders;
CREATE POLICY "Admins and owners manage folders"
    ON public.folders FOR ALL
    TO authenticated
    USING (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

-- 6. ROW LEVEL SECURITY (RLS) FOR PUBLIC.FILES
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read resource files" ON public.files;
CREATE POLICY "Anyone can read resource files"
    ON public.files FOR SELECT
    TO authenticated
    USING (
        is_private = FALSE OR
        uploaded_by = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Authenticated users upload resource files" ON public.files;
CREATE POLICY "Authenticated users upload resource files"
    ON public.files FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins and uploaders update resource files" ON public.files;
CREATE POLICY "Admins and uploaders update resource files"
    ON public.files FOR UPDATE
    TO authenticated
    USING (uploaded_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

DROP POLICY IF EXISTS "Admins and uploaders delete resource files" ON public.files;
CREATE POLICY "Admins and uploaders delete resource files"
    ON public.files FOR DELETE
    TO authenticated
    USING (uploaded_by = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    ));

-- 7. STORAGE OBJECT POLICIES FOR RESOURCES BUCKET
DROP POLICY IF EXISTS "Public and authenticated read resources" ON storage.objects;
CREATE POLICY "Public and authenticated read resources"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'resources');

DROP POLICY IF EXISTS "Authenticated users upload to resources" ON storage.objects;
CREATE POLICY "Authenticated users upload to resources"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'resources' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Owners and admins delete resource objects" ON storage.objects;
CREATE POLICY "Owners and admins delete resource objects"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'resources' AND (
        auth.uid() = owner OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    ));
