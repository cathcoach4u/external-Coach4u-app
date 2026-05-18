-- ═══════════════════════════════════════════════════════════════
-- v0.5.111 — multi-tenant: create_client_account
-- ═══════════════════════════════════════════════════════════════
--
-- Lets one user own MULTIPLE subscriptions (one per client account).
-- Adds an RPC that ALWAYS creates a new subscription + first business
-- + admin team_member, scoped under the caller's user_id.
--
-- The existing bootstrap_account_and_business RPC REUSES an existing
-- subscription if the user has one — that's the "first-time setup"
-- flow. This new RPC is for "set up another client account from
-- inside the dashboard" — always creates a new subscription.
--
-- No schema changes required. RLS on subscriptions already lets a
-- user insert/select their own rows; the index on owner_user_id is
-- non-unique so multiple subs per owner is already supported.
-- ═══════════════════════════════════════════════════════════════

-- DROP first — return type changed from `uuid` to `TABLE(...)` mid-version, and
-- Postgres won't let `CREATE OR REPLACE` change return type. Safe to run even
-- on a fresh install.
DROP FUNCTION IF EXISTS public.create_client_account(text, text);

CREATE OR REPLACE FUNCTION public.create_client_account(
  account_name  text,
  business_name text
)
RETURNS TABLE (subscription_id uuid, organisation_id uuid)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid                  uuid := auth.uid();
  v_subscription_id    uuid;
  v_organisation_id    uuid;
  v_account_name       text := NULLIF(trim(coalesce(account_name, '')), '');
  v_business_name      text := NULLIF(trim(coalesce(business_name, '')), '');
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF v_account_name IS NULL THEN
    RAISE EXCEPTION 'Account name is required';
  END IF;
  IF v_business_name IS NULL THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;

  -- Always create a NEW subscription (the whole point — multi-tenant)
  INSERT INTO public.subscriptions (owner_user_id, name)
  VALUES (uid, v_account_name)
  RETURNING id INTO v_subscription_id;

  -- Create the first business under it
  INSERT INTO public.organisations (subscription_id, name)
  VALUES (v_subscription_id, v_business_name)
  RETURNING id INTO v_organisation_id;

  -- Make the caller the admin of this new business
  INSERT INTO public.team_members (
    organisation_id, user_id, role, status, joined_at
  )
  VALUES (
    v_organisation_id, uid, 'admin', 'active', now()
  );

  subscription_id := v_subscription_id;
  organisation_id := v_organisation_id;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_client_account(text, text) TO authenticated;


-- ═══════════════════════════════════════════════════════════════
-- Update bootstrap_organisation to accept an optional subscription_id
-- ═══════════════════════════════════════════════════════════════
-- The original signature used LIMIT 1 to pick a subscription, which
-- arbitrary-picks for multi-tenant users. Adding subscription_id
-- (optional, NULL → falls back to LIMIT 1 for backward compat with
-- setup.html / single-account users).

DROP FUNCTION IF EXISTS public.bootstrap_organisation(text);

CREATE OR REPLACE FUNCTION public.bootstrap_organisation(
  business_name text,
  subscription_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid                  uuid := auth.uid();
  v_subscription_id    uuid := subscription_id;
  v_organisation_id    uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF business_name IS NULL OR length(trim(business_name)) = 0 THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;

  -- If a subscription_id was passed, validate the caller owns it
  IF v_subscription_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE id = v_subscription_id AND owner_user_id = uid
    ) THEN
      RAISE EXCEPTION 'Subscription not found or not owned by you';
    END IF;
  ELSE
    -- Backward compat: pick the user's first subscription, create one if none
    SELECT id INTO v_subscription_id
    FROM public.subscriptions
    WHERE owner_user_id = uid
    ORDER BY created_at ASC
    LIMIT 1;
    IF v_subscription_id IS NULL THEN
      INSERT INTO public.subscriptions (owner_user_id)
      VALUES (uid)
      RETURNING id INTO v_subscription_id;
    END IF;
  END IF;

  INSERT INTO public.organisations (subscription_id, name)
  VALUES (v_subscription_id, trim(business_name))
  RETURNING id INTO v_organisation_id;

  INSERT INTO public.team_members (
    organisation_id, user_id, role, status, joined_at
  ) VALUES (
    v_organisation_id, uid, 'admin', 'active', now()
  );

  RETURN v_organisation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_organisation(text, uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
