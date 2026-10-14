-- ==============================================================================
-- CareerNexus — Complete Alumni Mentorship Network & Real-Time Chat Infrastructure
-- Migration: 20261008_complete_mentorship_and_chat_system.sql
-- Description: Unifies connections, realtime publications, full replica identity,
--              dynamic notifications, and automatic conversation creation on accept.
-- ==============================================================================

-- 1. CONNECTIONS TABLE EXTENSIONS
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL DEFAULT 'mentorship',
    connection_type TEXT NOT NULL DEFAULT 'mentorship',
    mentorship_topic TEXT DEFAULT 'Career Guidance & Interview Prep',
    reason TEXT DEFAULT '',
    message TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'blocked'
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

-- Ensure all columns exist if connections table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'connection_type') THEN
        ALTER TABLE public.connections ADD COLUMN connection_type TEXT NOT NULL DEFAULT 'mentorship';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'request_type') THEN
        ALTER TABLE public.connections ADD COLUMN request_type TEXT NOT NULL DEFAULT 'mentorship';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'requester_name') THEN
        ALTER TABLE public.connections ADD COLUMN requester_name TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'requester_avatar') THEN
        ALTER TABLE public.connections ADD COLUMN requester_avatar TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'requester_department') THEN
        ALTER TABLE public.connections ADD COLUMN requester_department TEXT DEFAULT 'Computer Science & Engineering';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'requester_program') THEN
        ALTER TABLE public.connections ADD COLUMN requester_program TEXT DEFAULT 'B.Tech';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'requester_graduation_year') THEN
        ALTER TABLE public.connections ADD COLUMN requester_graduation_year INT DEFAULT 2027;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'requester_skills') THEN
        ALTER TABLE public.connections ADD COLUMN requester_skills TEXT[] DEFAULT ARRAY['Java', 'Data Structures', 'System Design']::TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'receiver_name') THEN
        ALTER TABLE public.connections ADD COLUMN receiver_name TEXT DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'connections' AND column_name = 'receiver_avatar') THEN
        ALTER TABLE public.connections ADD COLUMN receiver_avatar TEXT DEFAULT '';
    END IF;
END $$;

-- 2. NOTIFICATIONS TABLE EXTENSIONS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'sender_id') THEN
        ALTER TABLE public.notifications ADD COLUMN sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'reference_type') THEN
        ALTER TABLE public.notifications ADD COLUMN reference_type TEXT DEFAULT 'mentorship';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'reference_id') THEN
        ALTER TABLE public.notifications ADD COLUMN reference_id TEXT DEFAULT NULL;
    END IF;
END $$;

-- 3. ROW LEVEL SECURITY (RLS) FOR CONNECTIONS & NOTIFICATIONS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- 4. REALTIME PUBLICATIONS & REPLICA IDENTITY
ALTER TABLE public.connections REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_members REPLICA IDENTITY FULL;

DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 5. AUTOMATIC TRIGGER FOR SYNCHRONIZING CONNECTION FIELDS & NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.handle_connection_change_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_conv_id UUID;
BEGIN
    -- Synchronize connection_type & request_type
    IF NEW.connection_type IS NOT NULL AND (NEW.request_type IS NULL OR NEW.request_type = '') THEN
        NEW.request_type := NEW.connection_type;
    ELSIF NEW.request_type IS NOT NULL AND (NEW.connection_type IS NULL OR NEW.connection_type = '') THEN
        NEW.connection_type := NEW.request_type;
    END IF;

    -- Update timestamp
    NEW.updated_at := NOW();

    -- On INSERT with status 'pending': Dispatch notification to receiver (Alumni)
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        INSERT INTO public.notifications (
            user_id,
            sender_id,
            type,
            title,
            message,
            link,
            reference_type,
            reference_id,
            is_read,
            created_at
        ) VALUES (
            NEW.receiver_id,
            NEW.requester_id,
            'mentorship',
            'New mentorship request from ' || COALESCE(NULLIF(NEW.requester_name, ''), 'a student'),
            COALESCE(NULLIF(NEW.requester_name, ''), 'A student') || ' sent you a mentorship request for "' || COALESCE(NULLIF(NEW.mentorship_topic, ''), 'Career Guidance') || '".',
            '/alumni/dashboard',
            'mentorship',
            NEW.id::TEXT,
            FALSE,
            NOW()
        );
    END IF;

    -- On UPDATE to 'accepted': Dispatch notification to requester (Student) & Auto-enable Conversation
    IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
        NEW.accepted_at := NOW();

        -- 1. Create or get conversation between requester and receiver
        v_conv_id := public.get_or_create_conversation(NEW.requester_id, NEW.receiver_id);

        -- 2. Dispatch in-app notification to Student
        INSERT INTO public.notifications (
            user_id,
            sender_id,
            type,
            title,
            message,
            link,
            reference_type,
            reference_id,
            is_read,
            created_at
        ) VALUES (
            NEW.requester_id,
            NEW.receiver_id,
            'mentorship',
            COALESCE(NULLIF(NEW.receiver_name, ''), 'Your mentor') || ' accepted your mentorship request.',
            'You are now connected! 1-on-1 messaging and technical mentoring sessions are now active.',
            '/student/messages',
            'mentorship',
            NEW.id::TEXT,
            FALSE,
            NOW()
        );
    END IF;

    -- On UPDATE to 'rejected': Dispatch notification to requester (Student)
    IF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        INSERT INTO public.notifications (
            user_id,
            sender_id,
            type,
            title,
            message,
            link,
            reference_type,
            reference_id,
            is_read,
            created_at
        ) VALUES (
            NEW.requester_id,
            NEW.receiver_id,
            'mentorship',
            COALESCE(NULLIF(NEW.receiver_name, ''), 'The alumni') || ' rejected your mentorship request.',
            'Your mentorship request was not accepted at this time. You can explore other verified alumni mentors.',
            '/student/alumni',
            'mentorship',
            NEW.id::TEXT,
            FALSE,
            NOW()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_connection_change ON public.connections;
CREATE TRIGGER trg_handle_connection_change
    BEFORE INSERT OR UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_connection_change_trigger();
