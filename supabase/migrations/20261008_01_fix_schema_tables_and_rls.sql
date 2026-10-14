-- ==============================================================================
-- Migration: 20261008_01_fix_schema_tables_and_rls.sql
-- Description:
--   1. Grants execute permissions on get_user_role(uuid) to resolve 42501 error
--   2. Safely provisions missing tables: connections, conversations, conversation_members, student_tasks
--   3. Configures Row-Level Security (RLS) policies for authenticated participants
--   4. Adds connections and messages to the supabase_realtime publication
-- ==============================================================================

-- 1. FIX FUNCTION PERMISSIONS (Resolves 42501 error on applications & audit logs)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_user_role'
    ) THEN
        GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon, authenticated, service_role;
    END IF;
END $$;

-- 2. CREATE CONNECTIONS TABLE (For Mentorship Requests & Approvals)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL DEFAULT 'mentorship',
    connection_type TEXT NOT NULL DEFAULT 'mentorship',
    mentorship_topic TEXT DEFAULT 'Career Guidance & Interview Prep',
    reason TEXT DEFAULT '',
    message TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    requester_name TEXT DEFAULT '',
    requester_avatar TEXT DEFAULT '',
    requester_department TEXT DEFAULT 'Computer Science & Engineering',
    requester_program TEXT DEFAULT 'B.Tech',
    requester_graduation_year INT DEFAULT 2027,
    requester_skills TEXT[] DEFAULT ARRAY['Java', 'Data Structures', 'System Design']::TEXT[],
    receiver_name TEXT DEFAULT '',
    receiver_avatar TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMPTZ DEFAULT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_connection_pair UNIQUE (requester_id, receiver_id)
);

-- 3. CREATE CONVERSATIONS & MEMBERS TABLES (For Direct & Group Chat Isolation)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL DEFAULT 'direct', -- 'direct', 'mentorship', 'group'
    title TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ DEFAULT NULL,
    CONSTRAINT unique_conversation_member UNIQUE (conversation_id, user_id)
);

-- 4. CREATE STUDENT TASKS TABLE (For Placement Checklists)
CREATE TABLE IF NOT EXISTS public.student_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'general',
    due_date TIMESTAMPTZ DEFAULT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ENABLE ROW-LEVEL SECURITY
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

-- 6. CONFIGURE RLS POLICIES

-- Connections RLS: Only participants or admin can view and manage
DROP POLICY IF EXISTS "Participants can view connections" ON public.connections;
CREATE POLICY "Participants can view connections" ON public.connections
    FOR SELECT TO authenticated
    USING (
        auth.uid() = requester_id 
        OR auth.uid() = receiver_id 
        OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Requesters can create connections" ON public.connections;
CREATE POLICY "Requesters can create connections" ON public.connections
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Participants can update connection status" ON public.connections;
CREATE POLICY "Participants can update connection status" ON public.connections
    FOR UPDATE TO authenticated
    USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- Conversations RLS: Only conversation members or admin can view
DROP POLICY IF EXISTS "Members can view conversations" ON public.conversations;
CREATE POLICY "Members can view conversations" ON public.conversations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid()
        )
        OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Conversation Members RLS: Only participants of the conversation can view
DROP POLICY IF EXISTS "Members can view conversation members" ON public.conversation_members;
CREATE POLICY "Members can view conversation members" ON public.conversation_members
    FOR SELECT TO authenticated
    USING (
        conversation_id IN (
            SELECT cm.conversation_id FROM public.conversation_members cm
            WHERE cm.user_id = auth.uid()
        )
        OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

-- Messages RLS: Only sender, receiver, or conversation members can view
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
CREATE POLICY "Users can view their messages" ON public.messages
    FOR SELECT TO authenticated
    USING (
        auth.uid() = sender_id 
        OR auth.uid() = receiver_id
        OR (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);

-- 7. ENABLE REALTIME PUBLICATIONS (For live updates without refresh)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'connections'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
