-- PR4 — Exhibit publishing + embedding
-- Adds publish state + slug to captures and ADDS public (anon) read for
-- published captures and their annotations. The PR1 org-scoped policies remain;
-- RLS policies are OR'd, so org members still see their own private captures.
-- Safe to run as-is in the Supabase SQL Editor (idempotent guards).

ALTER TABLE public.captures
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Unique slug (Postgres allows many NULLs under a UNIQUE constraint).
CREATE UNIQUE INDEX IF NOT EXISTS idx_captures_slug ON public.captures(slug);

-- ============================================================================
-- Public read for published exhibits (anon + authenticated).
-- ============================================================================
DROP POLICY IF EXISTS "Public can view published captures" ON public.captures;
CREATE POLICY "Public can view published captures"
  ON public.captures FOR SELECT TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Public can view published annotations" ON public.annotations;
CREATE POLICY "Public can view published annotations"
  ON public.annotations FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = capture_id AND c.published = true
  ));
