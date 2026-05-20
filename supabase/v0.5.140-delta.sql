-- ═══════════════════════════════════════════════════════════════
-- v0.5.140 — manual sort_order on organisations
-- ═══════════════════════════════════════════════════════════════
--
-- Lets the account owner reorder the businesses list (and the
-- multi-biz switcher dropdown added in v0.5.139). Default sort_order
-- is 0 for all existing rows; the UI swaps adjacent rows to move
-- a business up or down.
--
-- No RLS changes — sort_order is a regular column under the existing
-- admins-write-organisations policy.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS organisations_sub_sort_idx
  ON public.organisations(subscription_id, sort_order);

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
