-- ═══════════════════════════════════════════════════════════════
-- v0.5.132 — Dual-mode planning + team check-in batches
-- ═══════════════════════════════════════════════════════════════
--
-- Planning sessions and team check-ins can now live at either:
--   • BUSINESS level — scoped by organisation_id (existing behaviour)
--   • ACCOUNT level  — scoped by subscription_id (new)
--
-- Exactly one of (organisation_id, subscription_id) is set per row.
-- A CHECK constraint enforces that.
--
-- New table:
--   checkin_batches  — standalone team check-in runs (not tied to a
--                      planning session); same dual-mode scoping.
--
-- Modified tables:
--   annual_sessions    + subscription_id; organisation_id now nullable
--   quarterly_sessions + subscription_id; organisation_id now nullable
--   team_checkins      session_type CHECK widened to allow 'batch';
--                      organisation_id stays NOT NULL (the check-in
--                      always belongs to an org for visibility),
--                      but session_id may point to a checkin_batch row.
--
-- RLS:
--   • Business-scoped rows: existing patterns (members read, admins write)
--   • Account-scoped rows:  any active member of any org in the
--                          subscription can read; subscription owner
--                          (or any admin in any org in the sub) writes.
--   • Batch-type team_checkins are admin-only readable (per user
--     direction "admin only" for analysis).
--
-- Helper function added:
--   public.user_account_ids(uid)
--     Returns subscription_ids the user has access to (owner OR
--     active team_member of any org in the sub).
-- ═══════════════════════════════════════════════════════════════


-- ─── 1. Helper function: subscription access ─────────────────────────
CREATE OR REPLACE FUNCTION public.user_account_ids(uid uuid)
RETURNS TABLE (subscription_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id
  FROM public.subscriptions s
  WHERE s.owner_user_id = uid
  UNION
  SELECT DISTINCT o.subscription_id
  FROM public.organisations o
  JOIN public.team_members tm ON tm.organisation_id = o.id
  WHERE tm.user_id = uid AND tm.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.user_admin_account_ids(uid uuid)
RETURNS TABLE (subscription_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  -- Subscription owner OR admin/coach of ANY org in the subscription
  SELECT s.id
  FROM public.subscriptions s
  WHERE s.owner_user_id = uid
  UNION
  SELECT DISTINCT o.subscription_id
  FROM public.organisations o
  JOIN public.team_members tm ON tm.organisation_id = o.id
  WHERE tm.user_id = uid
    AND tm.status = 'active'
    AND tm.role IN ('admin', 'coach');
$$;

GRANT EXECUTE ON FUNCTION public.user_account_ids(uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_admin_account_ids(uuid) TO authenticated;


-- ─── 2. annual_sessions: add subscription_id; loosen NOT NULL ────────
ALTER TABLE public.annual_sessions
  ALTER COLUMN organisation_id DROP NOT NULL;
ALTER TABLE public.annual_sessions
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.annual_sessions
  DROP CONSTRAINT IF EXISTS annual_sessions_scope_check;
ALTER TABLE public.annual_sessions
  ADD CONSTRAINT annual_sessions_scope_check
  CHECK ((organisation_id IS NOT NULL)::int + (subscription_id IS NOT NULL)::int = 1);
CREATE INDEX IF NOT EXISTS annual_sessions_sub_date_idx
  ON public.annual_sessions(subscription_id, session_date DESC);


-- ─── 3. quarterly_sessions: same shape as annual_sessions ────────────
ALTER TABLE public.quarterly_sessions
  ALTER COLUMN organisation_id DROP NOT NULL;
ALTER TABLE public.quarterly_sessions
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE;
ALTER TABLE public.quarterly_sessions
  DROP CONSTRAINT IF EXISTS quarterly_sessions_scope_check;
ALTER TABLE public.quarterly_sessions
  ADD CONSTRAINT quarterly_sessions_scope_check
  CHECK ((organisation_id IS NOT NULL)::int + (subscription_id IS NOT NULL)::int = 1);
CREATE INDEX IF NOT EXISTS quarterly_sessions_sub_date_idx
  ON public.quarterly_sessions(subscription_id, session_date DESC);


-- ─── 4. team_checkins: widen session_type to allow 'batch' ───────────
ALTER TABLE public.team_checkins
  DROP CONSTRAINT IF EXISTS team_checkins_session_type_check;
ALTER TABLE public.team_checkins
  ADD CONSTRAINT team_checkins_session_type_check
  CHECK (session_type IN ('annual', 'quarterly', 'batch'));

-- team_checkins.organisation_id stays NOT NULL — even for batch /
-- account-scoped sessions, the SUBMITTING member writes their org_id
-- so we can scope visibility. For account-level batches, we read by
-- joining via subscription_id stored on the batch row.


-- ─── 5. checkin_batches table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checkin_batches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid REFERENCES public.organisations(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  name            text NOT NULL,
  run_date        date NOT NULL DEFAULT CURRENT_DATE,
  invitees        jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes           text,
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','closed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT checkin_batches_scope_check
    CHECK ((organisation_id IS NOT NULL)::int + (subscription_id IS NOT NULL)::int = 1)
);
CREATE INDEX IF NOT EXISTS checkin_batches_org_date_idx
  ON public.checkin_batches(organisation_id, run_date DESC);
CREATE INDEX IF NOT EXISTS checkin_batches_sub_date_idx
  ON public.checkin_batches(subscription_id, run_date DESC);


ALTER TABLE public.checkin_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read checkin_batches" ON public.checkin_batches;
CREATE POLICY "members read checkin_batches" ON public.checkin_batches
  FOR SELECT USING (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_account_ids(auth.uid())))
  );

DROP POLICY IF EXISTS "admins write checkin_batches" ON public.checkin_batches;
CREATE POLICY "admins write checkin_batches" ON public.checkin_batches
  FOR ALL
  USING (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_admin_account_ids(auth.uid())))
  )
  WITH CHECK (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_admin_account_ids(auth.uid())))
  );


-- ─── 6. team_checkins RLS — batch reads are admin/coach only ─────────
DROP POLICY IF EXISTS "members read team_checkins" ON public.team_checkins;
DROP POLICY IF EXISTS "scoped read team_checkins" ON public.team_checkins;
CREATE POLICY "scoped read team_checkins" ON public.team_checkins
  FOR SELECT USING (
    CASE
      WHEN session_type = 'batch'
        THEN organisation_id IN (SELECT public.user_admin_org_ids(auth.uid()))
          OR organisation_id IN (
            SELECT o.id FROM public.organisations o
            WHERE o.subscription_id IN (SELECT public.user_admin_account_ids(auth.uid()))
          )
      ELSE
        organisation_id IN (SELECT public.user_org_ids(auth.uid()))
    END
  );
-- INSERT policy unchanged (members submit their own).


-- ─── 7. annual_sessions / quarterly_sessions RLS — handle both scopes ─
-- Existing policies live in the policies section of schema.sql. We
-- redefine them here to handle both org-scope and account-scope.
DROP POLICY IF EXISTS "members read annual_sessions" ON public.annual_sessions;
DROP POLICY IF EXISTS "admins write annual_sessions" ON public.annual_sessions;
CREATE POLICY "members read annual_sessions" ON public.annual_sessions
  FOR SELECT USING (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_account_ids(auth.uid())))
  );
CREATE POLICY "admins write annual_sessions" ON public.annual_sessions
  FOR ALL
  USING (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_admin_account_ids(auth.uid())))
  )
  WITH CHECK (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_admin_account_ids(auth.uid())))
  );

DROP POLICY IF EXISTS "members read quarterly_sessions" ON public.quarterly_sessions;
DROP POLICY IF EXISTS "admins write quarterly_sessions" ON public.quarterly_sessions;
CREATE POLICY "members read quarterly_sessions" ON public.quarterly_sessions
  FOR SELECT USING (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_account_ids(auth.uid())))
  );
CREATE POLICY "admins write quarterly_sessions" ON public.quarterly_sessions
  FOR ALL
  USING (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_admin_account_ids(auth.uid())))
  )
  WITH CHECK (
    (organisation_id IS NOT NULL AND organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
    OR
    (subscription_id IS NOT NULL AND subscription_id IN (SELECT public.user_admin_account_ids(auth.uid())))
  );

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
