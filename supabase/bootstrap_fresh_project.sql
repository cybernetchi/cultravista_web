-- ============================================================================
-- CultraVista — fresh project bootstrap (run ONCE in the Supabase SQL Editor)
-- ----------------------------------------------------------------------------
-- This recreates the entire database in a brand-new Supabase project, already
-- in its secure (PR1) end-state. It is the equivalent of running every file in
-- supabase/migrations/ in order, but consolidated into one clean script with
-- no throwaway "open" policies in between.
--
-- HOW TO USE:
--   1. Create a new Supabase project.
--   2. Open the project -> SQL Editor -> New query.
--   3. Paste this whole file, click "Run".
--
-- NOTE: Once you later install the Supabase CLI, mark these as applied with
--   `supabase migration repair --status applied <timestamp>` for each file in
--   supabase/migrations/, so the CLI doesn't try to re-run them.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Shared helper: keep updated_at fresh on every UPDATE.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ----------------------------------------------------------------------------
-- Identity / org model: profiles, organizations, memberships.
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_org_id ON public.memberships(org_id);

-- ----------------------------------------------------------------------------
-- Captures: scoped to an owner + org from the start.
-- ----------------------------------------------------------------------------
CREATE TABLE public.captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, -- canonical English title
  status INTEGER NOT NULL DEFAULT 0, -- 0 = processing, 1 = complete, 2 = failed
  thumbnail TEXT,
  file TEXT,
  serialize TEXT,
  folder_path TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- PR2 archival metadata
  title_zh_hant TEXT,
  description TEXT,
  description_zh_hant TEXT,
  capture_date DATE,
  location_text TEXT,
  lat NUMERIC,
  lng NUMERIC,
  rights_license TEXT,
  attribution TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'kiri', -- 'kiri' | 'upload'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- PR2: collections (museum/exhibition grouping) + capture link table.
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_zh_hant TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_collections_org_id ON public.collections(org_id);

CREATE TABLE public.collection_captures (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  capture_id UUID NOT NULL REFERENCES public.captures(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, capture_id)
);
CREATE INDEX idx_collection_captures_capture_id ON public.collection_captures(capture_id);

CREATE INDEX idx_captures_org_id ON public.captures(org_id);
CREATE INDEX idx_captures_owner_id ON public.captures(owner_id);

-- updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_captures_updated_at
  BEFORE UPDATE ON public.captures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Membership helpers (SECURITY DEFINER avoids RLS recursion).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_org_member(org UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = org AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(org UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = org AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  );
$$;

-- ----------------------------------------------------------------------------
-- On signup: auto-create profile + personal org + owner membership.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  display TEXT;
BEGIN
  display := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, display);

  INSERT INTO public.organizations (name, is_personal)
  VALUES (COALESCE(display, 'Personal') || '''s workspace', true)
  RETURNING id INTO new_org_id;

  INSERT INTO public.memberships (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Row Level Security.
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_captures ENABLE ROW LEVEL SECURITY;

-- captures: org-scoped read/write, admin-only delete.
CREATE POLICY "Org members can view captures"
  ON public.captures FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));
CREATE POLICY "Org members can create captures"
  ON public.captures FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_org_member(org_id));
CREATE POLICY "Org members can update captures"
  ON public.captures FOR UPDATE TO authenticated
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "Org admins can delete captures"
  ON public.captures FOR DELETE TO authenticated
  USING (public.is_org_admin(org_id));

-- profiles: own row only.
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- organizations: members read, admins update.
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id));
CREATE POLICY "Admins can update their organizations"
  ON public.organizations FOR UPDATE TO authenticated
  USING (public.is_org_admin(id)) WITH CHECK (public.is_org_admin(id));

-- memberships: see your own.
CREATE POLICY "Users can view own memberships"
  ON public.memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- collections: org-scoped read/write, admin-only delete.
CREATE POLICY "Org members can view collections"
  ON public.collections FOR SELECT TO authenticated
  USING (public.is_org_member(org_id));
CREATE POLICY "Org members can create collections"
  ON public.collections FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_org_member(org_id));
CREATE POLICY "Org members can update collections"
  ON public.collections FOR UPDATE TO authenticated
  USING (public.is_org_member(org_id)) WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "Org admins can delete collections"
  ON public.collections FOR DELETE TO authenticated
  USING (public.is_org_admin(org_id));

-- collection_captures: gated by membership of the parent collection's org.
CREATE POLICY "Org members can view collection links"
  ON public.collection_captures FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND public.is_org_member(c.org_id)));
CREATE POLICY "Org members can add collection links"
  ON public.collection_captures FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND public.is_org_member(c.org_id)));
CREATE POLICY "Org members can remove collection links"
  ON public.collection_captures FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c
    WHERE c.id = collection_id AND public.is_org_member(c.org_id)));

-- ----------------------------------------------------------------------------
-- Storage: public read (asset/thumbnail delivery + iframe viewer),
-- authenticated-only writes.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('captures', 'captures', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for captures"
  ON storage.objects FOR SELECT USING (bucket_id = 'captures');
CREATE POLICY "Authenticated can upload captures"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'captures');
CREATE POLICY "Authenticated can update captures"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'captures') WITH CHECK (bucket_id = 'captures');
CREATE POLICY "Authenticated can delete captures"
  ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'captures');
