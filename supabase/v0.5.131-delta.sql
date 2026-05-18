-- ═══════════════════════════════════════════════════════════════
-- v0.5.131 — enrich annual_sessions for richer capture
-- ═══════════════════════════════════════════════════════════════
--
-- Adds three columns to support the improved Annual Planning workspace:
--   notes           — free-form text captured during the session
--                     (decisions, energy, what surprised us, etc.)
--   external_links  — jsonb array of { label, url } for the user's own
--                     recording / slides / folder / photos. We don't
--                     store files — just links to the user's storage.
--   commitments     — jsonb array of { name, commitment } for the
--                     "One Thing" each leader is committing to for the
--                     year ahead.
--
-- All three are nullable (notes) or default empty arrays. No RLS
-- changes needed — existing annual_sessions policies cover them.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.annual_sessions
  ADD COLUMN IF NOT EXISTS notes          text,
  ADD COLUMN IF NOT EXISTS external_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS commitments    jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
