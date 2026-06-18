-- PR3 — Spatial storytelling: 3D hotspot annotations
-- Anchored 3D points on a capture with bilingual narration + optional camera pose,
-- ordered for tour playback. Org-scoped via the parent capture (reuses is_org_member).
-- Safe to run as-is in the Supabase SQL Editor (idempotent guards).

CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  capture_id UUID NOT NULL REFERENCES public.captures(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Rendered world-space coordinates of the hotspot (see PR3 coordinate note).
  position_x DOUBLE PRECISION NOT NULL,
  position_y DOUBLE PRECISION NOT NULL,
  position_z DOUBLE PRECISION NOT NULL,
  -- Optional saved camera framing: { position:[x,y,z], target:[x,y,z] }.
  camera_pose JSONB,
  title TEXT,
  title_zh_hant TEXT,
  body TEXT,
  body_zh_hant TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annotations_capture_order
  ON public.annotations(capture_id, order_index);

-- updated_at trigger (reuses the helper from PR1).
DROP TRIGGER IF EXISTS update_annotations_updated_at ON public.annotations;
CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON public.annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS — gated by membership of the parent capture's org.
-- ============================================================================
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view annotations" ON public.annotations;
CREATE POLICY "Org members can view annotations"
  ON public.annotations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = capture_id AND public.is_org_member(c.org_id)
  ));

DROP POLICY IF EXISTS "Org members can create annotations" ON public.annotations;
CREATE POLICY "Org members can create annotations"
  ON public.annotations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = capture_id AND public.is_org_member(c.org_id)
  ));

DROP POLICY IF EXISTS "Org members can update annotations" ON public.annotations;
CREATE POLICY "Org members can update annotations"
  ON public.annotations FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = capture_id AND public.is_org_member(c.org_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = capture_id AND public.is_org_member(c.org_id)
  ));

DROP POLICY IF EXISTS "Org members can delete annotations" ON public.annotations;
CREATE POLICY "Org members can delete annotations"
  ON public.annotations FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.captures c
    WHERE c.id = capture_id AND public.is_org_member(c.org_id)
  ));
