        v_uid::text,
        NOW(),
        NOW(),
        NOW()
    ) ON CONFLICT (provider, provider_id) DO UPDATE SET
        identity_data = EXCLUDED.identity_data,
        updated_at = NOW();

    INSERT INTO public.users (
        id, username, email, full_name, role, avatar_url, department, company, is_active, status, updated_at
    ) VALUES (
        v_uid,
        v_username,
        v_email,
        v_name,
        'admin'::user_role,
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        'Placement Administration',
        'CareerNexus Central Placement Cell',
        TRUE,
        'active',
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'admin'::user_role,
        department = EXCLUDED.department,
        company = EXCLUDED.company,
        is_active = TRUE,
        status = 'active',
        updated_at = NOW();
END $$;

-- 2. Seed Mentorship Connections (Valid UUIDs)
INSERT INTO public.connections (
    id, requester_id, receiver_id, requester_name, receiver_name,
    connection_type, status, mentorship_topic, message, created_at, accepted_at
) VALUES 
(
    '00000000-0000-0000-0033-000000000001',
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Aarav Sharma',
    'Tarun Narang',
    'mentorship',
    'accepted',
    'System Design & FAANG Interview Prep',
    'Hi Sir, looking forward to guidance on scalable systems and Google interview processes.',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '4 days'
),
(
    '00000000-0000-0000-0033-000000000002',
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0002-000000000002',
    'Diya Patel',
    'Deepika Kohli',
    'mentorship',
    'pending',
    'Cloud Architecture & Career Roadmap',
    'Hi Maam, hoping to connect regarding cloud architecture and modern web platforms.',
    NOW() - INTERVAL '2 days',
    NULL
)
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Conversations (Valid UUIDs)
INSERT INTO public.conversations (id, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0044-000000000001',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

-- Conversation Members
INSERT INTO public.conversation_members (id, conversation_id, user_id, joined_at)
VALUES
(
    '00000000-0000-0000-0045-000000000001',
    '00000000-0000-0000-0044-000000000001',
    '00000000-0000-0000-0001-000000000001',
    NOW() - INTERVAL '4 days'
),
(
    '00000000-0000-0000-0045-000000000002',
    '00000000-0000-0000-0044-000000000001',
    '00000000-0000-0000-0002-000000000001',
    NOW() - INTERVAL '4 days'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Messages (Valid UUIDs)
INSERT INTO public.messages (id, conversation_id, sender_id, receiver_id, message_text, is_read, created_at)
VALUES
(
    '00000000-0000-0000-0055-000000000001',
    '00000000-0000-0000-0044-000000000001',
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'Thank you for accepting my mentorship request! Excited to learn from your experience at Google.',
    TRUE,
    NOW() - INTERVAL '3 days'
),
(
    '00000000-0000-0000-0055-000000000002',
    '00000000-0000-0000-0044-000000000001',
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'Welcome Aarav! Review your trees and graph algorithms, and focus on clean modular code structure.',
    TRUE,
    NOW() - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0055-000000000003',
    '00000000-0000-0000-0044-000000000001',
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    'We can set up a mock system design interview this weekend.',
    FALSE,
    NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Re-enable role modification trigger on public.users
ALTER TABLE public.users ENABLE TRIGGER trg_protect_user_role_and_status;

COMMIT;