-- =============================================================
-- Your Business Coach — Supabase Schema (v0.5.79)
-- =============================================================
-- Per locked architecture (CLAUDE.md):
--   • Account-level subscriptions (1 buyer = 1 subscription, N orgs)
--   • Team-scoped data (every domain row belongs to an organisation)
--   • 2 roles: admin (read+write) / member (read-only + check-in submit)
--   • Global user pool — 1 person in 3 orgs = 1 seat
--   • Team check-in results visible to ALL active members of the org
--
-- Pricing model (v0.5.78):
--   • Base: $150/mo = 1 business + 3 users
--   • Each additional business: $75/mo
--   • Each additional user beyond 3: $60/mo
--
-- HOW TO APPLY
--   1. Open the Supabase SQL editor for the project
--      (https://eekefsuaefgpqmjdyniy.supabase.co).
--   2. Paste this entire file. Click Run.
--   3. Confirm no errors. If you see "already exists" errors, the
--      DROP block at the top should have cleared everything first.
--   4. Test: as a signed-in user, INSERT into `subscriptions` then
--      `organisations` then `team_members` (admin role) and confirm
--      RLS lets you SELECT them back.
-- =============================================================


-- =============================================================
-- 0. DROP old / incompatible tables (clean slate)
-- =============================================================

DROP TABLE IF EXISTS public.gwc_ratings CASCADE;
DROP TABLE IF EXISTS public.values_ratings CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.seats CASCADE;
DROP TABLE IF EXISTS public.meeting_todos CASCADE;
DROP TABLE IF EXISTS public.meeting_headlines CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.scorecard_entries CASCADE;
DROP TABLE IF EXISTS public.scorecard_metrics CASCADE;
DROP TABLE IF EXISTS public.rocks CASCADE;
DROP TABLE IF EXISTS public.vto CASCADE;
DROP TABLE IF EXISTS public.user_modules CASCADE;
DROP TABLE IF EXISTS public.organisations CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;

-- Also drop the NEW tables in case this script is re-run
DROP TABLE IF EXISTS public.team_checkins CASCADE;
DROP TABLE IF EXISTS public.quarterly_sessions CASCADE;
DROP TABLE IF EXISTS public.annual_sessions CASCADE;
DROP TABLE IF EXISTS public.leadership_team_members CASCADE;
DROP TABLE IF EXISTS public.marketing_strategy CASCADE;
DROP TABLE IF EXISTS public.targets CASCADE;
DROP TABLE IF EXISTS public.core_focus CASCADE;
DROP TABLE IF EXISTS public.core_values CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP FUNCTION IF EXISTS public.user_org_ids(uuid);
DROP FUNCTION IF EXISTS public.user_admin_org_ids(uuid);
-- KEEP public.users — it's the auth membership gate, used everywhere

-- Ensure public.users still has the expected shape
-- (already exists; safe to re-run)
CREATE TABLE IF NOT EXISTS public.users (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text NOT NULL,
  membership_status text NOT NULL DEFAULT 'inactive',
  name              text
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);


-- =============================================================
-- 1. ACCOUNT LEVEL — subscriptions, organisations, team_members
-- =============================================================

CREATE TABLE public.subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status                 text NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','past_due','canceled','trial')),
  seat_count             int  NOT NULL DEFAULT 3,        -- included users in the base plan
  included_businesses    int  NOT NULL DEFAULT 1,        -- usually 1
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_owner_idx ON public.subscriptions(owner_user_id);

CREATE TABLE public.organisations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  name            text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX organisations_subscription_idx ON public.organisations(subscription_id);

CREATE TABLE public.team_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email   text,                              -- set on invite, before user signs up
  role            text NOT NULL DEFAULT 'member'
                  CHECK (role IN ('admin','member')),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','removed')),
  display_name    text,
  invited_at      timestamptz NOT NULL DEFAULT now(),
  joined_at       timestamptz
);
-- One row per (org, user) once they've joined
CREATE UNIQUE INDEX team_members_org_user_uq
  ON public.team_members(organisation_id, user_id)
  WHERE user_id IS NOT NULL;
-- Pending invites are tracked by email
CREATE UNIQUE INDEX team_members_org_email_uq
  ON public.team_members(organisation_id, invited_email)
  WHERE invited_email IS NOT NULL AND status = 'pending';
CREATE INDEX team_members_user_idx ON public.team_members(user_id) WHERE user_id IS NOT NULL;


-- =============================================================
-- 2. RLS helper functions
-- =============================================================

-- All orgs the user has active membership in
CREATE OR REPLACE FUNCTION public.user_org_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.team_members
  WHERE user_id = uid AND status = 'active'
$$;

-- Orgs where the user is an active admin
CREATE OR REPLACE FUNCTION public.user_admin_org_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organisation_id FROM public.team_members
  WHERE user_id = uid AND role = 'admin' AND status = 'active'
$$;


-- =============================================================
-- 3. STRATEGY domain — 1 row per org per worksheet
-- =============================================================

CREATE TABLE public.core_values (
  organisation_id uuid PRIMARY KEY REFERENCES public.organisations(id) ON DELETE CASCADE,
  value_1 text, value_2 text, value_3 text, value_4 text,
  value_5 text, value_6 text, value_7 text, value_8 text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.core_focus (
  organisation_id uuid PRIMARY KEY REFERENCES public.organisations(id) ON DELETE CASCADE,
  purpose         text,
  niche           text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.targets (
  organisation_id    uuid PRIMARY KEY REFERENCES public.organisations(id) ON DELETE CASCADE,
  ten_year           text,
  three_year_date    text,
  three_year_revenue text,
  three_year_profit  text,
  three_year_desc    text,
  one_year_date      text,
  one_year_revenue   text,
  one_year_profit    text,
  one_year_goals     text,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_strategy (
  organisation_id uuid PRIMARY KEY REFERENCES public.organisations(id) ON DELETE CASCADE,
  target_market   text,
  uniques         text,
  proven_process  text,
  guarantee       text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leadership_team_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name             text NOT NULL DEFAULT '',
  role             text NOT NULL DEFAULT '',
  responsibilities text NOT NULL DEFAULT '',
  placeholder      boolean NOT NULL DEFAULT false,
  sort_order       int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX leadership_team_org_idx
  ON public.leadership_team_members(organisation_id, sort_order);


-- =============================================================
-- 4. OPERATIONS domain
-- =============================================================

CREATE TABLE public.scorecard_metrics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name             text NOT NULL,
  owner            text,
  goal             numeric,
  measurement_type text NOT NULL DEFAULT 'count'
                   CHECK (measurement_type IN ('count','currency','percentage','score')),
  sort_order       int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scorecard_metrics_org_idx
  ON public.scorecard_metrics(organisation_id, sort_order);

CREATE TABLE public.scorecard_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id  uuid NOT NULL REFERENCES public.scorecard_metrics(id) ON DELETE CASCADE,
  week_date  date NOT NULL,
  value      numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (metric_id, week_date)
);
CREATE INDEX scorecard_entries_metric_week_idx
  ON public.scorecard_entries(metric_id, week_date DESC);

CREATE TABLE public.rocks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  description     text NOT NULL,
  owner           text,
  status          text NOT NULL DEFAULT 'on_track'
                  CHECK (status IN ('on_track','at_risk','off_track','done','not_started')),
  quarter         text NOT NULL,                       -- 'Q2 2026'
  company_rock    boolean NOT NULL DEFAULT false,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rocks_org_quarter_idx
  ON public.rocks(organisation_id, quarter, sort_order);

CREATE TABLE public.issues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  description     text NOT NULL,
  owner           text,
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','resolved')),
  solution        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX issues_org_status_idx
  ON public.issues(organisation_id, status, created_at DESC);

CREATE TABLE public.meetings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  meeting_date    date NOT NULL,
  quarter         text,
  status          text NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','in_progress','completed')),
  rating          int CHECK (rating BETWEEN 1 AND 10),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meetings_org_date_idx
  ON public.meetings(organisation_id, meeting_date DESC);

CREATE TABLE public.meeting_headlines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('good_news','headline')),
  description text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meeting_headlines_meeting_idx ON public.meeting_headlines(meeting_id);

CREATE TABLE public.meeting_todos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description text NOT NULL,
  owner       text,
  done        boolean NOT NULL DEFAULT false,
  due_date    date,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX meeting_todos_meeting_idx ON public.meeting_todos(meeting_id);


-- =============================================================
-- 5. PLANNING SESSIONS
-- =============================================================

CREATE TABLE public.annual_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  session_date    date NOT NULL,
  year            text,
  status          text NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','in_progress','completed')),
  attendance      text NOT NULL DEFAULT '',
  areas_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX annual_sessions_org_date_idx
  ON public.annual_sessions(organisation_id, session_date DESC);

CREATE TABLE public.quarterly_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  session_date    date NOT NULL,
  target_quarter  text NOT NULL,
  status          text NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','in_progress','completed')),
  attendance      text NOT NULL DEFAULT '',
  areas_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quarterly_sessions_org_date_idx
  ON public.quarterly_sessions(organisation_id, session_date DESC);


-- =============================================================
-- 6. TEAM CHECK-INS — submissions from members for a session
-- =============================================================
-- 17 EOS-style rated statements + name + optional role.
-- session_id is polymorphic (refs annual_sessions OR quarterly_sessions);
-- session_type discriminates. organisation_id stored for RLS speed.

CREATE TABLE public.team_checkins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  session_id      uuid NOT NULL,
  session_type    text NOT NULL CHECK (session_type IN ('annual','quarterly')),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name            text NOT NULL,
  role            text,
  scores          jsonb NOT NULL,                  -- array of 17 ints (1-5)
  comments        jsonb NOT NULL DEFAULT '[]'::jsonb,
  submitted_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX team_checkins_session_idx
  ON public.team_checkins(session_id, session_type);
CREATE INDEX team_checkins_org_idx ON public.team_checkins(organisation_id);


-- =============================================================
-- 7. ENABLE RLS on every domain table
-- =============================================================

ALTER TABLE public.subscriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organisations            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_values              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_focus               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.targets                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_strategy       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leadership_team_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecard_metrics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorecard_entries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rocks                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_headlines        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_todos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_checkins            ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- 8. RLS POLICIES
-- =============================================================

-- subscriptions: owner can read+update; user inserts their own on signup
CREATE POLICY "owner reads own subscription"   ON public.subscriptions
  FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "owner updates own subscription" ON public.subscriptions
  FOR UPDATE USING (owner_user_id = auth.uid());
CREATE POLICY "user inserts own subscription"  ON public.subscriptions
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

-- organisations: any team member reads; admins (or subscription owner) write
CREATE POLICY "members read their orgs" ON public.organisations
  FOR SELECT USING (id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write their orgs" ON public.organisations
  FOR ALL
  USING (id IN (SELECT public.user_admin_org_ids(auth.uid()))
         OR subscription_id IN (SELECT id FROM public.subscriptions WHERE owner_user_id = auth.uid()))
  WITH CHECK (id IN (SELECT public.user_admin_org_ids(auth.uid()))
              OR subscription_id IN (SELECT id FROM public.subscriptions WHERE owner_user_id = auth.uid()));

-- team_members: members read team in their orgs; admins write
CREATE POLICY "members read team in their orgs" ON public.team_members
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write team members" ON public.team_members
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));
-- Special: a user with a pending invite must be able to SELECT/UPDATE their own row to accept it
CREATE POLICY "invited user accepts own invite" ON public.team_members
  FOR UPDATE
  USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (user_id = auth.uid() AND status = 'active');

-- ============= Standard policy macro for org-scoped data tables =============
-- READ:  org-member can read
-- WRITE: admin can write

CREATE POLICY "members read core_values"  ON public.core_values
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write core_values"  ON public.core_values
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

CREATE POLICY "members read core_focus"  ON public.core_focus
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write core_focus"  ON public.core_focus
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

CREATE POLICY "members read targets"  ON public.targets
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write targets"  ON public.targets
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

CREATE POLICY "members read marketing_strategy"  ON public.marketing_strategy
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write marketing_strategy"  ON public.marketing_strategy
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

CREATE POLICY "members read leadership"  ON public.leadership_team_members
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write leadership"  ON public.leadership_team_members
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

CREATE POLICY "members read scorecard_metrics"  ON public.scorecard_metrics
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write scorecard_metrics"  ON public.scorecard_metrics
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

-- scorecard_entries: scoped via metric's org_id
CREATE POLICY "members read scorecard_entries" ON public.scorecard_entries
  FOR SELECT USING (metric_id IN (
    SELECT id FROM public.scorecard_metrics
    WHERE organisation_id IN (SELECT public.user_org_ids(auth.uid()))
  ));
CREATE POLICY "admins write scorecard_entries" ON public.scorecard_entries
  FOR ALL
  USING (metric_id IN (
    SELECT id FROM public.scorecard_metrics
    WHERE organisation_id IN (SELECT public.user_admin_org_ids(auth.uid()))
  ))
  WITH CHECK (metric_id IN (
    SELECT id FROM public.scorecard_metrics
    WHERE organisation_id IN (SELECT public.user_admin_org_ids(auth.uid()))
  ));

CREATE POLICY "members read rocks"  ON public.rocks
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write rocks"  ON public.rocks
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

CREATE POLICY "members read issues"  ON public.issues
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write issues"  ON public.issues
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

CREATE POLICY "members read meetings"  ON public.meetings
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write meetings"  ON public.meetings
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

-- meeting_headlines: scoped via meeting's org_id
CREATE POLICY "members read meeting_headlines" ON public.meeting_headlines
  FOR SELECT USING (meeting_id IN (
    SELECT id FROM public.meetings
    WHERE organisation_id IN (SELECT public.user_org_ids(auth.uid()))
  ));
CREATE POLICY "admins write meeting_headlines" ON public.meeting_headlines
  FOR ALL
  USING (meeting_id IN (
    SELECT id FROM public.meetings
    WHERE organisation_id IN (SELECT public.user_admin_org_ids(auth.uid()))
  ))
  WITH CHECK (meeting_id IN (
    SELECT id FROM public.meetings
    WHERE organisation_id IN (SELECT public.user_admin_org_ids(auth.uid()))
  ));

-- meeting_todos: same as headlines
CREATE POLICY "members read meeting_todos" ON public.meeting_todos
  FOR SELECT USING (meeting_id IN (
    SELECT id FROM public.meetings
    WHERE organisation_id IN (SELECT public.user_org_ids(auth.uid()))
  ));
CREATE POLICY "admins write meeting_todos" ON public.meeting_todos
  FOR ALL
  USING (meeting_id IN (
    SELECT id FROM public.meetings
    WHERE organisation_id IN (SELECT public.user_admin_org_ids(auth.uid()))
  ))
  WITH CHECK (meeting_id IN (
    SELECT id FROM public.meetings
    WHERE organisation_id IN (SELECT public.user_admin_org_ids(auth.uid()))
  ));

CREATE POLICY "members read annual_sessions"  ON public.annual_sessions
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write annual_sessions"  ON public.annual_sessions
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

CREATE POLICY "members read quarterly_sessions"  ON public.quarterly_sessions
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "admins write quarterly_sessions"  ON public.quarterly_sessions
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

-- team_checkins: SPECIAL — any active org member reads + inserts; only admins delete/update.
CREATE POLICY "members read team_checkins" ON public.team_checkins
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));
CREATE POLICY "members insert own team_checkin" ON public.team_checkins
  FOR INSERT WITH CHECK (
    organisation_id IN (SELECT public.user_org_ids(auth.uid()))
    AND (user_id = auth.uid() OR user_id IS NULL)
  );
CREATE POLICY "admins update team_checkins" ON public.team_checkins
  FOR UPDATE
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));
CREATE POLICY "admins delete team_checkins" ON public.team_checkins
  FOR DELETE
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));


-- =============================================================
-- 9. Helper view — current team members (one row per active user-in-org)
-- =============================================================
CREATE OR REPLACE VIEW public.v_active_team AS
SELECT
  tm.id              AS team_member_id,
  tm.organisation_id,
  o.name             AS organisation_name,
  tm.user_id,
  u.email,
  tm.role,
  tm.display_name,
  tm.joined_at
FROM public.team_members tm
JOIN public.organisations o ON o.id = tm.organisation_id
LEFT JOIN auth.users u ON u.id = tm.user_id
WHERE tm.status = 'active';


-- =============================================================
-- DONE
-- =============================================================
-- Next steps (in code, not SQL):
-- v0.5.80 — auth/signup flow: create subscription + org + admin team_member on first signup
-- v0.5.81 — "My Businesses" landing page + business switcher in header
-- v0.5.82 — "My Team" page (invite + role management)
-- v0.5.83 — replace each tool's localStorage api() with supabase.from() calls
