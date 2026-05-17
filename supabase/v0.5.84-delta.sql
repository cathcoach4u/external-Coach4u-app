-- 12. TEAM MANAGEMENT + BUSINESS CRUD (v0.5.84)
-- =============================================================
-- These functions back the SARUBA account dashboard (my-businesses.html):
--   • invite_team_member(business_id, email, role, display_name)
--   • remove_team_member(member_id)
--   • rename_business(business_id, new_name)
--   • delete_business(business_id)
--   • link_pending_invites() trigger — wires invited_email → user_id on signup
-- All are SECURITY DEFINER. Caller must be an active admin of the org.

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
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE organisation_id = business_id
      AND user_id = uid
      AND role = 'admin'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only admins can invite team members';
  END IF;

  -- See if this email belongs to an existing auth.users row
  SELECT id INTO v_existing_user
  FROM auth.users
  WHERE lower(email) = v_email
  LIMIT 1;

  -- Already in this org? (active or pending) — return existing id, don't duplicate
  IF v_existing_user IS NOT NULL THEN
    SELECT id INTO v_existing_row
    FROM public.team_members
    WHERE organisation_id = business_id
      AND user_id = v_existing_user
      AND status <> 'removed'
    LIMIT 1;
    IF v_existing_row IS NOT NULL THEN
      RETURN v_existing_row;
    END IF;
  ELSE
    SELECT id INTO v_existing_row
    FROM public.team_members
    WHERE organisation_id = business_id
      AND lower(coalesce(invited_email, '')) = v_email
      AND status = 'pending'
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

  -- Caller must be an active admin of this org
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE organisation_id = v_org_id
      AND user_id = uid
      AND role = 'admin'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only admins can remove team members';
  END IF;

  -- Guard: don't allow removing the only remaining admin
  IF v_role = 'admin' THEN
    SELECT count(*) INTO v_admin_cnt
    FROM public.team_members
    WHERE organisation_id = v_org_id
      AND role = 'admin'
      AND status = 'active'
      AND id <> member_id;
    IF v_admin_cnt = 0 THEN
      RAISE EXCEPTION 'Cannot remove the only admin of this business. Promote another member first.';
    END IF;
  END IF;

  UPDATE public.team_members
  SET status = 'removed'
  WHERE id = member_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_team_member(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION public.rename_business(business_id uuid, new_name text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid       uuid := auth.uid();
  v_clean   text := trim(coalesce(new_name, ''));
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF business_id IS NULL THEN
    RAISE EXCEPTION 'business_id is required';
  END IF;
  IF v_clean = '' THEN
    RAISE EXCEPTION 'Business name cannot be empty';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE organisation_id = business_id
      AND user_id = uid
      AND role = 'admin'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only admins can rename this business';
  END IF;

  UPDATE public.organisations
  SET name = v_clean
  WHERE id = business_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rename_business(uuid, text) TO authenticated;


CREATE OR REPLACE FUNCTION public.delete_business(business_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid              uuid := auth.uid();
  v_subscription   uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF business_id IS NULL THEN
    RAISE EXCEPTION 'business_id is required';
  END IF;

  -- Caller must be admin of this org
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE organisation_id = business_id
      AND user_id = uid
      AND role = 'admin'
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete this business';
  END IF;

  -- Caller must also own the subscription that owns this org
  SELECT subscription_id INTO v_subscription
  FROM public.organisations
  WHERE id = business_id;

  IF v_subscription IS NULL THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE id = v_subscription
      AND owner_user_id = uid
  ) THEN
    RAISE EXCEPTION 'Only the account owner can delete a business';
  END IF;

  DELETE FROM public.organisations WHERE id = business_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_business(uuid) TO authenticated;


-- =============================================================
-- 13. AUTO-LINK pending invites on signup
-- =============================================================
-- When a new auth.users row is INSERTed, claim any team_members rows that
-- were created with invited_email = NEW.email (status='pending', user_id NULL).

CREATE OR REPLACE FUNCTION public.link_pending_invites()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.team_members
  SET user_id = NEW.id, status = 'active', joined_at = now(), invited_email = NULL
  WHERE invited_email IS NOT NULL
    AND lower(invited_email) = lower(NEW.email)
    AND status = 'pending';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_pending_invites_on_signup ON auth.users;
CREATE TRIGGER link_pending_invites_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.link_pending_invites();


-- =============================================================
-- DONE
