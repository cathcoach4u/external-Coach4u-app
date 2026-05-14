-- =============================================================
-- Your Business Coach — Supabase Schema Reference
-- =============================================================
-- Two separate Supabase projects are used:
--
--   PROJECT A (Portal / Auth)
--   URL: https://eekefsuaefgpqmjdyniy.supabase.co
--   Used by: login.html, index.html, strategy.html, operations.html
--            and all root-level pages
--
--   PROJECT B (Business Dashboard)
--   URL: https://uoixetfvboevjxlkfyqy.supabase.co
--   Used by: business/index.html and the full business app
-- =============================================================


-- =============================================================
-- PROJECT A — Portal / Auth
-- =============================================================

-- Add a new member (run in Project A SQL editor)
-- INSERT INTO users (id, email, membership_status)
-- SELECT id, email, 'active'
-- FROM auth.users
-- WHERE LOWER(email) = LOWER('email@here.com');

CREATE TABLE public.users (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             text NOT NULL,
  membership_status text NOT NULL DEFAULT 'inactive',  -- 'active' | 'inactive'
  name              text
);

-- RLS: allow each user to read their own row
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);


-- =============================================================
-- PROJECT B — Business Dashboard
-- =============================================================

CREATE TABLE public.businesses (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL,
  color text,                        -- hex colour e.g. '#0D9488'
  type  text DEFAULT 'holding'       -- 'holding' | 'sub'
);

CREATE TABLE public.user_modules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  active      boolean NOT NULL DEFAULT true
);

CREATE TABLE public.organisations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL
);

-- VTO (Vision / Traction Organiser)
-- Stored as key/value pairs per section via /vto/{section}/{key}
CREATE TABLE public.vto (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES auth.users(id),
  -- Core Focus
  core_focus     text,               -- purpose / niche combined or JSON
  -- Core Values (up to 6)
  core_value_1   text,
  core_value_2   text,
  core_value_3   text,
  core_value_4   text,
  core_value_5   text,
  core_value_6   text,
  -- Targets
  ten_year_target text,
  three_year_revenue text,
  one_year_plan  text,
  one_year_revenue text,
  one_year_profit  text,
  -- Marketing
  marketing_plan text,
  -- Legacy / portal snapshot fields
  core_values    jsonb,              -- array used by portal dashboard
  one_year_plan_summary text
);

-- Rocks (Quarterly Priorities)
CREATE TABLE public.rocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  description  text NOT NULL,
  owner        text,
  status       text NOT NULL DEFAULT 'not_started',  -- 'not_started' | 'on_track' | 'off_track' | 'done'
  quarter      text,                                  -- e.g. 'Q2 2026'
  company_rock boolean DEFAULT false,
  seat_id      uuid REFERENCES public.seats(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now()
);

-- Scorecard Metrics
CREATE TABLE public.scorecard_metrics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name             text NOT NULL,
  owner            text,
  goal             numeric,
  measurement_type text DEFAULT 'number',  -- 'number' | 'currency' | 'percentage'
  sort_order       integer DEFAULT 0
);

-- Scorecard Entries (weekly values)
CREATE TABLE public.scorecard_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id  uuid NOT NULL REFERENCES public.scorecard_metrics(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  week_date  date NOT NULL,
  value      numeric,
  on_track   boolean
);

-- Issues (IDS — Identify, Discuss, Solve)
CREATE TABLE public.issues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  description text NOT NULL,
  owner       text,
  priority    text DEFAULT 'medium',        -- 'low' | 'medium' | 'high'
  status      text DEFAULT 'open',          -- 'open' | 'ids_in_progress' | 'resolved'
  solution    text,                          -- required when status = 'resolved'
  meeting_id  uuid REFERENCES public.meetings(id) ON DELETE SET NULL,
  resolved    boolean GENERATED ALWAYS AS (status = 'resolved') STORED,
  created_at  timestamptz DEFAULT now()
);

-- Meetings (L10 structure)
CREATE TABLE public.meetings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES auth.users(id),
  meeting_date timestamptz NOT NULL,
  quarter      text,                          -- e.g. 'Q2 2026'
  status       text DEFAULT 'scheduled',      -- 'scheduled' | 'in_progress' | 'completed'
  rating       integer CHECK (rating BETWEEN 1 AND 10),
  notes        text,
  created_at   timestamptz DEFAULT now()
);

-- Meeting Headlines
CREATE TABLE public.meeting_headlines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  type        text NOT NULL,  -- 'good_news' | 'customer' | 'employee'
  description text NOT NULL
);

-- Meeting To-Dos
CREATE TABLE public.meeting_todos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description text NOT NULL,
  owner       text,
  due_date    date,
  status      text DEFAULT 'pending'  -- 'pending' | 'done'
);

-- Seats (Accountability Chart)
CREATE TABLE public.seats (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title            text NOT NULL,
  person           text,
  parent_id        uuid REFERENCES public.seats(id) ON DELETE SET NULL,
  responsibilities jsonb,   -- array of responsibility strings
  sort_order       integer DEFAULT 0
);

-- Team Members
CREATE TABLE public.members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name        text NOT NULL,
  seat_id     uuid REFERENCES public.seats(id) ON DELETE SET NULL
);

-- Core Values Alignment Ratings
CREATE TABLE public.values_ratings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id  uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  value_key  text NOT NULL,
  rating     text DEFAULT 'none'  -- 'none' | 'plus' | 'plus_minus' | 'minus'
);

-- GWC Ratings (Get it / Want it / Capacity)
CREATE TABLE public.gwc_ratings (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  get_it    text DEFAULT 'none',   -- 'none' | 'plus' | 'plus_minus' | 'minus'
  want_it   text DEFAULT 'none',
  capacity  text DEFAULT 'none'
);
