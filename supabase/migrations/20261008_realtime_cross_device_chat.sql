-- ==============================================================================
-- CareerNexus — Real-Time Cross-Device Chat & Messaging Infrastructure
-- Migration: 20261008_realtime_cross_device_chat.sql
-- Modules: conversations, conversation_members, messages (with required schema),
--          Realtime publications, RLS security policies, triggers & notification dispatch
-- ==============================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT DEFAULT NULL,
    last_message_text TEXT DEFAULT '',
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONVERSATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_conversation_member UNIQUE(conversation_id, user_id)
);

-- 3. MESSAGES TABLE (Ensures exact required fields)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL DEFAULT '',
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'file', 'image', 'system'
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Backward compatibility fields
    content TEXT DEFAULT '',
    sender_name TEXT DEFAULT '',
    sender_avatar TEXT DEFAULT '',
    sender_role TEXT DEFAULT 'student',
    attachment_name TEXT DEFAULT '',
    attachment_url TEXT DEFAULT '',
    attachment_size TEXT DEFAULT '',
    read_at TIMESTAMPTZ DEFAULT NULL
);

-- Ensure all required columns exist on public.messages if table already existed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message_text') THEN
        ALTER TABLE public.messages ADD COLUMN message_text TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message_type') THEN
        ALTER TABLE public.messages ADD COLUMN message_type TEXT NOT NULL DEFAULT 'text';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'is_read') THEN
        ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'updated_at') THEN
        ALTER TABLE public.messages ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;

    -- Sync existing content into message_text
    UPDATE public.messages
    SET message_text = content
    WHERE (message_text IS NULL OR message_text = '') AND content IS NOT NULL AND content != '';

    -- Sync is_read with read_at
    UPDATE public.messages
    SET is_read = TRUE
    WHERE read_at IS NOT NULL;
END $$;

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conv ON public.conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5.1 Conversations Policies
DROP POLICY IF EXISTS "conversations_select_policy" ON public.conversations;
CREATE POLICY "conversations_select_policy" ON public.conversations
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = public.conversations.id AND cm.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "conversations_insert_policy" ON public.conversations;
CREATE POLICY "conversations_insert_policy" ON public.conversations
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "conversations_update_policy" ON public.conversations;
CREATE POLICY "conversations_update_policy" ON public.conversations
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = public.conversations.id AND cm.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 5.2 Conversation Members Policies
DROP POLICY IF EXISTS "conv_members_select_policy" ON public.conversation_members;
CREATE POLICY "conv_members_select_policy" ON public.conversation_members
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = public.conversation_members.conversation_id AND cm.user_id = auth.uid()
        ) OR
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "conv_members_insert_policy" ON public.conversation_members;
CREATE POLICY "conv_members_insert_policy" ON public.conversation_members
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "conv_members_update_policy" ON public.conversation_members;
CREATE POLICY "conv_members_update_policy" ON public.conversation_members
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 5.3 Messages Policies
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT TO authenticated
    USING (
        auth.uid() = sender_id OR
        auth.uid() = receiver_id OR
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id::text = public.messages.conversation_id AND cm.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND (
            -- Admin or recruiter bypass
            EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'recruiter')) OR
            -- Accepted mutual connection
            EXISTS (
                SELECT 1 FROM public.connections
                WHERE status = 'accepted' AND (
                    (requester_id = auth.uid() AND receiver_id = public.messages.receiver_id) OR
                    (receiver_id = auth.uid() AND requester_id = public.messages.receiver_id)
                )
            ) OR
            -- Conversation membership check
            EXISTS (
                SELECT 1 FROM public.conversation_members cm
                WHERE cm.conversation_id::text = public.messages.conversation_id AND cm.user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
CREATE POLICY "messages_update_policy" ON public.messages
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = receiver_id OR
        auth.uid() = sender_id OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. TRIGGERS & FUNCTIONS

-- 6.1 Synchronize message text, content, read status and timestamp
CREATE OR REPLACE FUNCTION public.sync_message_fields_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchronize message_text and content
    IF (NEW.message_text IS NULL OR NEW.message_text = '') AND NEW.content IS NOT NULL AND NEW.content != '' THEN
        NEW.message_text := NEW.content;
    ELSIF (NEW.content IS NULL OR NEW.content = '') AND NEW.message_text IS NOT NULL AND NEW.message_text != '' THEN
        NEW.content := NEW.message_text;
    END IF;

    -- Synchronize read status and read timestamp
    IF NEW.is_read = TRUE AND NEW.read_at IS NULL THEN
        NEW.read_at := NOW();
    ELSIF NEW.read_at IS NOT NULL THEN
        NEW.is_read := TRUE;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_message_fields ON public.messages;
CREATE TRIGGER trg_sync_message_fields
    BEFORE INSERT OR UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_message_fields_trigger();

-- 6.2 After Message Insert: Update Conversation & Generate Realtime Notification
CREATE OR REPLACE FUNCTION public.handle_message_after_insert_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_role TEXT := 'student';
    v_notification_link TEXT := '/student/messages';
    v_sender_display_name TEXT := 'Someone';
BEGIN
    -- 1. Update conversations table last message summary
    IF NEW.conversation_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        UPDATE public.conversations
        SET
            last_message_text = COALESCE(NULLIF(NEW.message_text, ''), 'Sent an attachment'),
            last_message_at = NEW.created_at,
            last_sender_id = NEW.sender_id,
            updated_at = NOW()
        WHERE id = NEW.conversation_id::UUID;
    END IF;

    -- 2. Determine Receiver Role for Link Routing
    SELECT role INTO v_receiver_role FROM public.users WHERE id = NEW.receiver_id;
    IF v_receiver_role = 'alumni' THEN
        v_notification_link := '/alumni/messages';
    ELSIF v_receiver_role = 'recruiter' THEN
        v_notification_link := '/recruiter/messages';
    ELSIF v_receiver_role = 'admin' THEN
        v_notification_link := '/admin/messages';
    ELSE
        v_notification_link := '/student/messages';
    END IF;

    -- 3. Resolve Sender Name
    SELECT full_name INTO v_sender_display_name FROM public.users WHERE id = NEW.sender_id;
    IF v_sender_display_name IS NULL OR v_sender_display_name = '' THEN
        v_sender_display_name := COALESCE(NULLIF(NEW.sender_name, ''), 'Placement Member');
    END IF;

    -- 4. Dispatch in-app notification to receiver
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        link,
        is_read,
        created_at
    ) VALUES (
        NEW.receiver_id,
        'message',
        'New message from ' || v_sender_display_name,
        CASE
            WHEN LENGTH(NEW.message_text) > 75 THEN SUBSTRING(NEW.message_text FROM 1 FOR 72) || '...'
            WHEN NEW.message_text != '' THEN NEW.message_text
            ELSE 'Sent an attachment'
        END,
        v_notification_link,
        FALSE,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_message_after_insert ON public.messages;
CREATE TRIGGER trg_handle_message_after_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_message_after_insert_trigger();

-- 7. HELPER RPC FUNCTIONS

-- 7.1 Idempotent Get or Create Conversation between 2 Users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
    p_user1 UUID,
    p_user2 UUID
)
RETURNS UUID AS $$
DECLARE
    v_conv_id UUID;
BEGIN
    -- Look for existing 1-on-1 conversation
    SELECT cm1.conversation_id INTO v_conv_id
    FROM public.conversation_members cm1
    JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    WHERE cm1.user_id = p_user1 AND cm2.user_id = p_user2
    LIMIT 1;

    -- If found, return existing ID
    IF v_conv_id IS NOT NULL THEN
        RETURN v_conv_id;
    END IF;

    -- Create new conversation
    INSERT INTO public.conversations (created_at, updated_at)
    VALUES (NOW(), NOW())
    RETURNING id INTO v_conv_id;

    -- Add both participants as conversation members
    INSERT INTO public.conversation_members (conversation_id, user_id, joined_at, last_read_at)
    VALUES
        (v_conv_id, p_user1, NOW(), NOW()),
        (v_conv_id, p_user2, NOW(), NOW())
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 Mark conversation messages as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(
    p_conversation_id TEXT,
    p_reader_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET
        is_read = TRUE,
        read_at = NOW(),
        updated_at = NOW()
    WHERE conversation_id = p_conversation_id
      AND receiver_id = p_reader_id
      AND is_read = FALSE;

    IF p_conversation_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        UPDATE public.conversation_members
        SET last_read_at = NOW()
        WHERE conversation_id = p_conversation_id::UUID AND user_id = p_reader_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. REALTIME REPLICATION CONFIGURATION
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
