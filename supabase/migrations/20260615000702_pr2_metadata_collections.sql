-- PR2 — Archive-grade metadata + collections (minimal)
-- Adds bilingual archival metadata to captures and a collections grouping.
-- Safe to run as-is in the Supabase SQL Editor (idempotent guards) since the
-- live project's schema is applied there rather than via the CLI.

-- ============================================================================
-- 1. Archival metadata on captures.
--    `title` stays the canonical English title; we add Traditional Chinese
--    and the remaining provenance/rights fields alongside it.
-- ============================================================================
ALTER TABLE public.captures
  ADD COLUMN IF NOT EXISTS title_zh_hant TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS description_zh_hant TEXT,
  ADD COLUMN IF NOT EXISTS capture_date DATE,
  ADD COLUMN IF NOT EXISTS location_text TEXT,
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC,
  ADD COLUMN IF NOT EXISTS rights_license TEXT,
  ADD COLUMN IF NOT EXISTS attribution TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'kiri';

-- ============================================================================
-- 2. Collections (museum/exhibition grouping) + capture link table.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_zh_hant TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collections_org_id ON public.collections(org_id);

CREATE TABLE IF NOT EXISTS public.collection_captures (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  capture_id UUID NOT NULL REFERENCES public.captures(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, capture_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_captures_capture_id
  ON public.collection_captures(capture_id);

-- updated_at trigger (reuses the helper from PR1).
DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 3. RLS — org-scoped, reusing PR1 helpers.
-- ============================================================================
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_captures ENABLE ROW LEVEL SECURITY;

-- collections
DROP POLICY IF EXISTS "Org members can view collections" ON public.collections;
CREATE POLICY "Org members can view collections"
  ON public.collections FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));

DROP POLICY IF EXISTS "Org members can create collections" ON public.collections;
CREATE POLICY "Org members can create collections"
  ON public.collections FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_org_member(org_id));

DROP POLICY IF EXISTS "Org members can update collections" ON public.collections;
CREATE POLICY "Org members can update collections"
  ON public.collections FOR UPDATE TO authenticated
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

DROP POLICY IF EXISTS "Org admins can delete collections" ON public.collections;
CREATE POLICY "Org admins can delete collections"
  ON public.collections FOR DELETE TO authenticated
  USING (public.is_org_admin(org_id));

-- collection_captures: gated by membership of the parent collection's org.
DROP POLICY IF EXISTS "Org members can view collection links" ON public.collection_captures;
CREATE POLICY "Org members can view collection links"
  ON public.collection_captures FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND public.is_org_member(c.org_id)
  ));

DROP POLICY IF EXISTS "Org members can add collection links" ON public.collection_captures;
CREATE POLICY "Org members can add collection links"
  ON public.collection_captures FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND public.is_org_member(c.org_id)
  ));

DROP POLICY IF EXISTS "Org members can remove collection links" ON public.collection_captures;
CREATE POLICY "Org members can remove collection links"
  ON public.collection_captures FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND public.is_org_member(c.org_id)
  ));
