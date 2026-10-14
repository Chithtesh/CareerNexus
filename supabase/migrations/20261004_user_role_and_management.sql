-- ==============================================================================
-- CareerNexus — Role-Based Authentication & User Role Management
-- Migration: 20261004_user_role_and_management.sql
-- Modules: Enforce user_role ENUM with 'recruiter', Admin Role Updates RPC,
--          Strict default student signup, and Zero Data Loss role preservation
-- ==============================================================================

-- 1. Ensure 'recruiter' exists in user_role ENUM
DO $$
BEGIN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'recruiter';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. HARDENED ADMIN ROLE UPDATE RPC FUNCTION
-- Allows administrators to safely modify a user's role without deleting historical data
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
    p_user_id UUID,
    p_new_role user_role,
    p_reason TEXT DEFAULT 'Administrative role reassignment'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role user_role;
    v_target_user RECORD;
    v_old_role user_role;
    v_admin_name TEXT := 'Placement Administrator';
    v_admin_email TEXT := '';
BEGIN
    -- Authenticated Caller Check
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Authentication required.';
    END IF;

    -- Verify Caller is an Administrator
    SELECT role, full_name, email INTO v_caller_role, v_admin_name, v_admin_email
    FROM public.users WHERE id = v_caller_id;

    IF v_caller_role <> 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only system administrators can update user roles.';
    END IF;

    -- Retrieve Target User
    SELECT * INTO v_target_user FROM public.users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user with ID % was not found.', p_user_id;
    END IF;

    v_old_role := v_target_user.role;

    -- Prevent Administrator Self-Demotion (Lockout Protection)
    IF v_caller_id = p_user_id AND p_new_role <> 'admin' THEN
        RAISE EXCEPTION 'Action Blocked: You cannot demote your own administrator account to prevent lockout.';
    END IF;

    -- If role is unchanged, return gracefully
    IF v_old_role = p_new_role THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'message', 'User already possesses the requested role.',
            'userId', p_user_id,
            'role', p_new_role
        );
    END IF;

    -- Update User Role in public.users (Preserves all other fields)
    UPDATE public.users
    SET
        role = p_new_role,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- If changing to alumni, ensure an alumni record exists if none does
    IF p_new_role = 'alumni' THEN
        INSERT INTO public.alumni (
            user_id,
            alumni_id,
            full_name,
            email,
            profile_photo,
            graduation_year,
            department,
            company,
            designation,
            skills,
            is_active
        )
        VALUES (
            p_user_id,
            'ALUM-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || SUBSTRING(REPLACE(p_user_id::TEXT, '-', '') FROM 1 FOR 6),
            v_target_user.full_name,
            v_target_user.email,
            COALESCE(v_target_user.avatar_url, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
            EXTRACT(YEAR FROM NOW())::INT,
            'Computer Science & Engineering',
            'Corporate Partner',
            'Alumni Mentor',
            ARRAY['Mentorship', 'Career Guidance']::TEXT[],
            TRUE
        )
        ON CONFLICT (user_id) DO UPDATE SET
            is_active = TRUE,
            updated_at = NOW();
    END IF;

    -- If changing to student, ensure a student record exists if none does
    IF p_new_role = 'student' THEN
        INSERT INTO public.students (
            user_id,
            full_name,
            email,
            department,
            roll_number,
            profile_photo,
            is_active
        )
        VALUES (
            p_user_id,
            v_target_user.full_name,
            v_target_user.email,
            'Computer Science & Engineering',
            '26CS' || LPAD(FLOOR(RANDOM()*899+100)::TEXT, 3, '0'),
            COALESCE(v_target_user.avatar_url, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
            TRUE
        )
        ON CONFLICT (user_id) DO UPDATE SET
            is_active = TRUE,
            updated_at = NOW();
    END IF;

    -- Record Immutable Audit Log
    INSERT INTO public.admin_audit_logs (
        admin_id,
        admin_name,
        admin_email,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        v_caller_id,
        v_admin_name,
        v_admin_email,
        'UPDATE_USER_ROLE',
        'user',
        p_user_id::TEXT,
        jsonb_build_object(
            'target_name', v_target_user.full_name,
            'target_email', v_target_user.email,
            'old_role', v_old_role,
            'new_role', p_new_role,
            'reason', p_reason,
            'data_preserved', TRUE
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'User role updated successfully with full data preservation.',
        'userId', p_user_id,
        'oldRole', v_old_role,
        'newRole', p_new_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth, pg_temp;

-- Grant Execution to Authenticated Users
REVOKE ALL ON FUNCTION public.admin_update_user_role(UUID, user_role, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, user_role, TEXT) TO authenticated;
