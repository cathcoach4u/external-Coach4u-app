-- ═══════════════════════════════════════════════════════════════
-- v0.5.110 — add 'coach' role
-- ═══════════════════════════════════════════════════════════════
--
-- The Coach role is admin-equivalent for *data* and *team* operations
-- but is intended to be exempt from per-seat billing (when billing is
-- wired up). Use case: the business coach (you) is added to a client's
-- account and can edit everything WITHOUT consuming one of the client's
-- 3 included user seats.
--
-- WHAT CHANGES:
--   1. team_members.role CHECK constraint accepts 'coach'
--   2. user_admin_org_ids(uid) includes coaches → all RLS policies on
--      data tables that gate writes via this helper now allow coaches
--      to write (same as admins) — no per-table policy edits needed.
--   3. invite_team_member() accepts 'coach' role AND lets coaches invite
--   4. remove_team_member() lets coaches remove other members
--   5. rename_business() and delete_business() are LEFT admin-only —
--      coaches manage data + team, but business lifecycle stays with
--      the subscription owner / admin.
--
-- Run this once in the Supabase SQL Editor. No data migration.
-- ═══════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────
-- 1. Relax the role CHECK constraint
-- ───────────────────────────────────────────────────────────────
ALTER TABLE public.team_members
  DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (role IN ('admin', 'coach', 'member'));


-- ───────────────────────────────────────────────────────────────
-- 2. Promote coaches to admin-write access via the helper
-- ───────────────────────────────────────────────────────────────
-- Every RLS policy on a data table uses `user_admin_org_ids(auth.uid())`
-- in its WITH CHECK. Adding 'coach' here gives coaches admin writes
-- everywhere without touching ~20 individual table policies.

CREATE OR REPLACE FUNCTION public.user_admin_org_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.team_members
  WHERE user_id = uid
    AND role IN ('admin', 'coach')
    AND status = 'active';
$$;


-- ───────────────────────────────────────────────────────────────
-- 3. invite_team_member — accept 'coach' role + coaches can invite
-- ───────────────────────────────────────────────────────────────
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
  IF v_role NOT IN ('admin', 'coach', 'member') THEN
    RAISE EXCEPTION 'Role must be admin, coach, or member';
  END IF;

  -- Caller must be an active admin OR coach of this org
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.organisation_id = business_id
      AND team_members.user_id = uid
      AND team_members.role IN ('admin', 'coach')
      AND team_members.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only admins or coaches can invite team members';
  END IF;

  SELECT id INTO v_existing_user
  FROM auth.users
  WHERE lower(auth.users.email) = v_email
  LIMIT 1;

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


-- ───────────────────────────────────────────────────────────────
-- 4. remove_team_member — coaches can remove (same scope as invite)
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.remove_team_member(member_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid          uuid := auth.uid();
  v_org_id     uuid;
  v_user_id    uuid;
  v_role       text;
  v_admin_cnt  int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF member_id IS NULL THEN
    RAISE EXCEPTION 'member_id is required';
  END IF;

  SELECT organisation_id, user_id, role
    INTO v_org_id, v_user_id, v_role
  FROM public.team_members
  WHERE id = member_id;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Team member not found';
  END IF;

  -- Caller must be an active admin OR coach of this org
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.organisation_id = v_org_id
      AND team_members.user_id = uid
      AND team_members.role IN ('admin', 'coach')
      AND team_members.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only admins or coaches can remove team members';
  END IF;

  -- Don't allow removing the last remaining admin (coaches don't count)
  IF v_role = 'admin' THEN
    SELECT COUNT(*) INTO v_admin_cnt
    FROM public.team_members
    WHERE team_members.organisation_id = v_org_id
      AND team_members.role = 'admin'
      AND team_members.status = 'active';
    IF v_admin_cnt <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last admin of this business';
    END IF;
  END IF;

  UPDATE public.team_members
  SET status = 'removed'
  WHERE id = member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_team_member(uuid) TO authenticated;


-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
-- After running, you can:
--   • Invite a user with role='coach' from the UI (v0.5.110+)
--   • Coaches see admin-equivalent UI and write access
--   • rename_business() / delete_business() still require role='admin'
-- ═══════════════════════════════════════════════════════════════
