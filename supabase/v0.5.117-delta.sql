-- ═══════════════════════════════════════════════════════════════
-- v0.5.117 — financial_periods (monthly revenue + expenses)
-- ═══════════════════════════════════════════════════════════════
--
-- New table to back the "Last 12 months / Next 12 months" financial
-- outlook on the one-page plan. One row per (organisation, month).
-- The "actual vs forecast" distinction is implicit from the period
-- date: months on/before this calendar month are actuals, months
-- after are forecasts. Same revenue/expenses columns either way.
--
-- RLS mirrors core_values / targets / etc.:
--   READ  — active member of the org (via user_org_ids)
--   WRITE — admin or coach of the org (via user_admin_org_ids)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.financial_periods (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id  uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  period           date NOT NULL,            -- first day of the month, e.g. 2026-05-01
  revenue          numeric,                  -- nullable: blank cells allowed
  expenses         numeric,                  -- nullable
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organisation_id, period)
);

CREATE INDEX IF NOT EXISTS financial_periods_org_period_idx
  ON public.financial_periods(organisation_id, period);

ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members read financial_periods" ON public.financial_periods;
CREATE POLICY "members read financial_periods" ON public.financial_periods
  FOR SELECT USING (organisation_id IN (SELECT public.user_org_ids(auth.uid())));

DROP POLICY IF EXISTS "admins write financial_periods" ON public.financial_periods;
CREATE POLICY "admins write financial_periods" ON public.financial_periods
  FOR ALL
  USING (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())))
  WITH CHECK (organisation_id IN (SELECT public.user_admin_org_ids(auth.uid())));

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
