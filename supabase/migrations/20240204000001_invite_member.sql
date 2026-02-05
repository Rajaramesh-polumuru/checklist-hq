/*
  Phase 5: Invite Members
  
  Adds functionality to invite users to an organization by email.
  Since auth.users is protected, we need a SECURITY DEFINER function to look up IDs.
*/

-- Function to look up a user ID by email (Security Critical!)
-- Only callable by authenticated users, but we must be careful not to leak info.
-- In a real app, you'd send an email. Here, for MVP, we'll return the ID if found
-- so the frontend can add them directly, OR we do the add inside this function.

CREATE OR REPLACE FUNCTION public.add_member_by_email(
    p_organization_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'member'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner to access auth.users
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID;
    v_inviter_role TEXT;
BEGIN
    -- 1. Check if the caller is an admin/owner of the org
    SELECT role INTO v_inviter_role
    FROM public.organization_members
    WHERE organization_id = p_organization_id
    AND user_id = auth.uid();

    IF v_inviter_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'Not authorized to add members';
    END IF;

    -- 2. Find the user by email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'User not found');
    END IF;

    -- 3. Check if already a member
    IF EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_organization_id
        AND user_id = v_user_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'User is already a member');
    END IF;

    -- 4. Add the member
    INSERT INTO public.organization_members (organization_id, user_id, role, invited_by, joined_at)
    VALUES (p_organization_id, v_user_id, p_role, auth.uid(), NOW());

    RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;
