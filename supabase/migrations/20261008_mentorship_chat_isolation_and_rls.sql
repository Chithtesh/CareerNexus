-- ==============================================================================
-- CareerNexus — Mentorship Chat Placement, Conversation Isolation & RLS Security
-- Migration: 20261008_mentorship_chat_isolation_and_rls.sql
-- Modules: conversations, conversation_members, messages, connections, RLS policies
-- ==============================================================================

-- 1. ENSURE PROPER INDEXES FOR CONVERSATION ISOLATION
CREATE INDEX IF NOT EXISTS idx_conv_members_composite ON public.conversation_members(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status_type ON public.connections(status, connection_type);
CREATE INDEX IF NOT EXISTS idx_connections_requester_receiver ON public.connections(requester_id, receiver_id, status);

-- 2. HARDEN CONVERSATION RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2.1 Conversations SELECT & INSERT Policies
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

-- 2.2 Conversation Members Policies
DROP POLICY IF EXISTS "conv_members_select_policy" ON public.conversation_members;
CREATE POLICY "conv_members_select_policy" ON public.conversation_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.conversation_members cm
            WHERE cm.conversation_id = public.conversation_members.conversation_id AND cm.user_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 2.3 Strict Message Security Policies (Conversation Isolation)
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT TO authenticated
    USING (
        (
            (auth.uid() = sender_id OR auth.uid() = receiver_id)
            AND (
                -- Must be a member of the conversation
                EXISTS (
                    SELECT 1 FROM public.conversation_members cm
                    WHERE cm.conversation_id::text = public.messages.conversation_id AND cm.user_id = auth.uid()
                )
                -- Or accepted mentorship connection between these two exact participants
                OR EXISTS (
                    SELECT 1 FROM public.connections c
                    WHERE c.status = 'accepted'
                      AND c.connection_type = 'mentorship'
                      AND (
                          (c.requester_id = auth.uid() AND c.receiver_id = CASE WHEN public.messages.sender_id = auth.uid() THEN public.messages.receiver_id ELSE public.messages.sender_id END)
                          OR (c.receiver_id = auth.uid() AND c.requester_id = CASE WHEN public.messages.sender_id = auth.uid() THEN public.messages.receiver_id ELSE public.messages.sender_id END)
                      )
                )
            )
        )
        OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND (
            -- Sender and receiver must have an accepted mentorship connection
            EXISTS (
                SELECT 1 FROM public.connections c
                WHERE c.status = 'accepted'
                  AND c.connection_type = 'mentorship'
                  AND (
                      (c.requester_id = auth.uid() AND c.receiver_id = public.messages.receiver_id) OR
                      (c.receiver_id = auth.uid() AND c.requester_id = public.messages.receiver_id)
                  )
            )
            -- Or sender is an authorized conversation member
            OR EXISTS (
                SELECT 1 FROM public.conversation_members cm
                WHERE cm.conversation_id::text = public.messages.conversation_id AND cm.user_id = auth.uid()
            )
            -- Or admin / recruiter role
            OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'recruiter'))
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

-- 3. VALIDATED MENTORSHIP RPC FUNCTION
CREATE OR REPLACE FUNCTION public.get_or_create_mentorship_conversation(
    p_student_id UUID,
    p_mentor_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_conn_status TEXT;
    v_conv_id UUID;
BEGIN
    -- 1. Verify accepted mentorship connection
    SELECT status INTO v_conn_status
    FROM public.connections
    WHERE (
        (requester_id = p_student_id AND receiver_id = p_mentor_id) OR
        (requester_id = p_mentor_id AND receiver_id = p_student_id)
    )
    AND connection_type = 'mentorship'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_conn_status IS NULL OR v_conn_status != 'accepted' THEN
        RAISE EXCEPTION 'Mentorship connection is not accepted. Chat is restricted.';
    END IF;

    -- 2. Find existing conversation between these two exact participants
    SELECT cm1.conversation_id INTO v_conv_id
    FROM public.conversation_members cm1
    JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    WHERE cm1.user_id = p_student_id AND cm2.user_id = p_mentor_id
    LIMIT 1;

    IF v_conv_id IS NOT NULL THEN
        RETURN v_conv_id;
    END IF;

    -- 3. Create isolated conversation
    INSERT INTO public.conversations (
        title,
        last_message_text,
        last_message_at,
        created_at,
        updated_at
    ) VALUES (
        'Mentorship Session',
        'Mentorship connection accepted',
        NOW(),
        NOW(),
        NOW()
    ) RETURNING id INTO v_conv_id;

    -- 4. Add both as verified conversation members
    INSERT INTO public.conversation_members (conversation_id, user_id, joined_at, last_read_at)
    VALUES
        (v_conv_id, p_student_id, NOW(), NOW()),
        (v_conv_id, p_mentor_id, NOW(), NOW())
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ISOLATED MESSAGE NOTIFICATION TRIGGER
CREATE OR REPLACE FUNCTION public.handle_message_notification_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify ONLY the receiver of this specific message
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
        NEW.sender_id,
        'mentorship',
        'New message from ' || COALESCE(NULLIF(NEW.sender_name, ''), 'your contact'),
        CASE
            WHEN LENGTH(NEW.message_text) > 80 THEN SUBSTRING(NEW.message_text FROM 1 FOR 77) || '...'
            ELSE NEW.message_text
        END,
        CASE
            WHEN NEW.sender_role = 'student' THEN '/alumni/messages'
            ELSE '/student/messages'
        END,
        'mentorship_message',
        NEW.conversation_id,
        FALSE,
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_handle_message_notification ON public.messages;
CREATE TRIGGER trg_handle_message_notification
    AFTER INSERT ON public.messages
    FOR EACH ROW
    WHEN (NEW.receiver_id IS NOT NULL)
    EXECUTE FUNCTION public.handle_message_notification_trigger();
