-- ═══════════════════════════════════════════════════════════════
-- v0.5.107 — fix "column reference 'role' is ambiguous" in invite_team_member
-- ═══════════════════════════════════════════════════════════════
--
-- Bug: the function's parameter is named `role` and the team_members
-- table also has a `role` column. The admin-check EXISTS query used the
-- unqualified `role` reference, which Postgres flagged as ambiguous.
--
-- Fix: qualify the column references in the admin-check as
-- `team_members.role`, `team_members.user_id`, etc.
--
-- Run this once in the Supabase SQL Editor. It replaces the function
-- definition in place — no data changes.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.invite_team_member(
  business_id  uuid,
  email        text,
  role         text DEFAULT 'member',
  display_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid              uuid := auth.uid();
  v_email          text := lower(trim(coalesce(email, '')));
  v_role           text := lower(trim(coalesce(role, 'member')));
  v_existing_user  uuid;
  v_existing_row   uuid;
  v_new_id         uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF business_id IS NULL THEN
    RAISE EXCEPTION 'business_id is required';
  END IF;
  IF v_email = '' OR position('@' in v_email) = 0 THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;
  IF v_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Role must be admin or member';
  END IF;

  -- Caller must be an active admin of this org
  -- (Qualify the column references so they don't collide with the `role` parameter.)
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.organisation_id = business_id
      AND team_members.user_id = uid
      AND team_members.role = 'admin'
      AND team_members.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only admins can invite team members';
  END IF;

  -- See if this email belongs to an existing auth.users row
  SELECT id INTO v_existing_user
  FROM auth.users
  WHERE lower(auth.users.email) = v_email
  LIMIT 1;

  -- Already in this org? (active or pending) — return existing id, don't duplicate
  IF v_existing_user IS NOT NULL THEN
    SELECT id INTO v_existing_row
    FROM public.team_members
    WHERE team_members.organisation_id = business_id
      AND team_members.user_id = v_existing_user
      AND team_members.status <> 'removed'
    LIMIT 1;
    IF v_existing_row IS NOT NULL THEN
      RETURN v_existing_row;
    END IF;
  ELSE
    SELECT id INTO v_existing_row
    FROM public.team_members
    WHERE team_members.organisation_id = business_id
      AND lower(coalesce(team_members.invited_email, '')) = v_email
      AND team_members.status = 'pending'
    LIMIT 1;
    IF v_existing_row IS NOT NULL THEN
      RETURN v_existing_row;
    END IF;
  END IF;

  IF v_existing_user IS NOT NULL THEN
    INSERT INTO public.team_members (
      organisation_id, user_id, role, status, display_name, joined_at
    ) VALUES (
      business_id, v_existing_user, v_role, 'active',
      NULLIF(trim(coalesce(display_name, '')), ''), now()
    )
    RETURNING id INTO v_new_id;
  ELSE
    INSERT INTO public.team_members (
      organisation_id, invited_email, role, status, display_name
    ) VALUES (
      business_id, v_email, v_role, 'pending',
      NULLIF(trim(coalesce(display_name, '')), '')
    )
    RETURNING id INTO v_new_id;
  END IF;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_team_member(uuid, text, text, text) TO authenticated;
