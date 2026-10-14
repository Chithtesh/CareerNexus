-- ==============================================================================
-- CareerNexus — Alumni Professional Network, Mentorship, Connections & WebRTC Signaling
-- Migration: 20261007_alumni_professional_network.sql
-- ==============================================================================

-- 1. EXTEND PUBLIC.ALUMNI TABLE WITH PROFESSIONAL NETWORK FIELDS
DO $$
BEGIN
    -- Industry
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'industry') THEN
        ALTER TABLE public.alumni ADD COLUMN industry TEXT NOT NULL DEFAULT 'Information Technology';
    END IF;

    -- Location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'location') THEN
        ALTER TABLE public.alumni ADD COLUMN location TEXT NOT NULL DEFAULT 'Bengaluru, India';
    END IF;

    -- Mentorship Topics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'mentorship_topics') THEN
        ALTER TABLE public.alumni ADD COLUMN mentorship_topics TEXT[] NOT NULL DEFAULT ARRAY['System Design', 'Backend Architecture', 'Career Guidance']::TEXT[];
    END IF;

    -- Professional Website URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'website_url') THEN
        ALTER TABLE public.alumni ADD COLUMN website_url TEXT DEFAULT '';
    END IF;

    -- Verified Status & Verification Date
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'is_verified') THEN
        ALTER TABLE public.alumni ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'verified_at') THEN
        ALTER TABLE public.alumni ADD COLUMN verified_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Contact Visibility: 'public', 'connected_only', 'hidden'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'contact_visibility') THEN
        ALTER TABLE public.alumni ADD COLUMN contact_visibility TEXT NOT NULL DEFAULT 'connected_only';
    END IF;

    -- Structured Contact Methods (JSONB array of { type, label, url, is_visible })
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'alumni' AND column_name = 'contact_methods') THEN
        ALTER TABLE public.alumni ADD COLUMN contact_methods JSONB NOT NULL DEFAULT '[]'::JSONB;
    END IF;
END $$;

-- 2. CREATE CONNECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL DEFAULT 'mentorship', -- 'mentorship' | 'professional'
    mentorship_topic TEXT DEFAULT 'Career Guidance & Interview Prep',
    reason TEXT DEFAULT '',
    message TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'blocked'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_connection_pair UNIQUE (requester_id, receiver_id)
);

-- Indexes for connection queries
CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- 3. ROW LEVEL SECURITY (RLS) FOR CONNECTIONS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connections_select_policy" ON public.connections;
CREATE POLICY "connections_select_policy" ON public.connections
    FOR SELECT TO authenticated
    USING (
        requester_id = auth.uid() OR
        receiver_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "connections_insert_policy" ON public.connections;
CREATE POLICY "connections_insert_policy" ON public.connections
    FOR INSERT TO authenticated
    WITH CHECK (
        requester_id = auth.uid()
    );

DROP POLICY IF EXISTS "connections_update_policy" ON public.connections;
CREATE POLICY "connections_update_policy" ON public.connections
    FOR UPDATE TO authenticated
    USING (
        receiver_id = auth.uid() OR
        requester_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "connections_delete_policy" ON public.connections;
CREATE POLICY "connections_delete_policy" ON public.connections
    FOR DELETE TO authenticated
    USING (
        requester_id = auth.uid() OR
        receiver_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. RLS ENFORCEMENT ON MESSAGES & CALLS: ONLY ACCEPTED CONNECTIONS CAN CHAT/CALL
-- Policy on messages table: Users can message each other if an accepted connection exists, or if admin/recruiter
DROP POLICY IF EXISTS "messages_connection_guard_policy" ON public.messages;
CREATE POLICY "messages_connection_guard_policy" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND (
            -- Admin or recruiter bypass
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'recruiter')) OR
            -- Accepted connection exists
            EXISTS (
                SELECT 1 FROM public.connections
                WHERE status = 'accepted' AND (
                    (requester_id = auth.uid() AND receiver_id = public.messages.receiver_id) OR
                    (receiver_id = auth.uid() AND requester_id = public.messages.receiver_id)
                )
            )
        )
    );

-- Policy on calls table: Users can initiate call if an accepted connection exists, or if admin
DROP POLICY IF EXISTS "calls_connection_guard_policy" ON public.calls;
CREATE POLICY "calls_connection_guard_policy" ON public.calls
    FOR INSERT TO authenticated
    WITH CHECK (
        caller_id = auth.uid() AND (
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') OR
            EXISTS (
                SELECT 1 FROM public.connections
                WHERE status = 'accepted' AND (
                    (requester_id = auth.uid() AND receiver_id = public.calls.receiver_id) OR
                    (receiver_id = auth.uid() AND requester_id = public.calls.receiver_id)
                )
            )
        )
    );
