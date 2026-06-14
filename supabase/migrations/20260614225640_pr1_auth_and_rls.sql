-- PR1 — Auth + lock down security
-- Adds an ownership/org data model, auto-provisions a personal org per user,
-- and rewrites all RLS so captures + storage are authenticated + org-scoped.
-- Replaces the previous wide-open "anyone can do anything" policies.

-- ============================================================================
-- 1. New tables: profiles, organizations, memberships
-- ============================================================================

-- profiles — 1:1 with auth.users, holds display info.
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- organizations — the unit captures are scoped to. Each user gets a personal one.
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- memberships — user ↔ org with a role.
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- Index for the common "which orgs does this user belong to" lookup.
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_org_id ON public.memberships(org_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Reuse the existing timestamp trigger (defined in the first migration).
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. Membership helper (SECURITY DEFINER avoids RLS recursion between
--    captures <-> memberships, and between memberships' own policies).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(org UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = org AND m.user_id = auth.uid()
  );
$$;

-- True when the caller is an owner/admin of the org (used for privileged writes).
CREATE OR REPLACE FUNCTION public.is_org_admin(org UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.org_id = org
      AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'admin')
  );
$$;

-- ============================================================================
-- 3. Auto-provision profile + personal org + owner membership on signup.
--    Also claims any pre-auth (orphaned) captures for the designated owner.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  display TEXT;
BEGIN
  -- Prefer an OAuth-provided name, fall back to the local part of the email.
  display := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, display);

  INSERT INTO public.organizations (name, is_personal)
  VALUES (COALESCE(display, 'Personal') || '''s workspace', true)
  RETURNING id INTO new_org_id;

  INSERT INTO public.memberships (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  -- One-time claim: when the original owner signs up, adopt the captures that
  -- existed before auth (owner_id IS NULL) into their personal org. No-op for
  -- everyone else, so a stranger cannot grab the pre-auth data.
  IF NEW.email = 'hi@kachi-chan.com' THEN
    UPDATE public.captures
    SET owner_id = NEW.id, org_id = new_org_id
    WHERE owner_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. Scope captures to an owner + org.
--    Columns stay NULLABLE for now so pre-auth rows survive until claimed;
--    a follow-up migration enforces NOT NULL once the data is confirmed clean.
-- ============================================================================

ALTER TABLE public.captures
  ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_captures_org_id ON public.captures(org_id);
CREATE INDEX idx_captures_owner_id ON public.captures(owner_id);

-- ============================================================================
-- 5. RLS rewrite — captures.
--    Drop the wide-open policies and replace with org-scoped ones.
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view captures" ON public.captures;
DROP POLICY IF EXISTS "Anyone can create captures" ON public.captures;
DROP POLICY IF EXISTS "Anyone can update captures" ON public.captures;
DROP POLICY IF EXISTS "Anyone can delete captures" ON public.captures;

-- Read: any member of the owning org.
CREATE POLICY "Org members can view captures"
  ON public.captures FOR SELECT
  TO authenticated
  USING (public.is_org_member(org_id));

-- Insert: caller must be the owner and a member of the target org.
CREATE POLICY "Org members can create captures"
  ON public.captures FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid() AND public.is_org_member(org_id));

-- Update: any member of the owning org (cannot move a row to an org you're not in).
CREATE POLICY "Org members can update captures"
  ON public.captures FOR UPDATE
  TO authenticated
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

-- Delete: owner/admin of the owning org only.
CREATE POLICY "Org admins can delete captures"
  ON public.captures FOR DELETE
  TO authenticated
  USING (public.is_org_admin(org_id));

-- ============================================================================
-- 6. RLS — profiles / organizations / memberships.
-- ============================================================================

-- profiles: a user sees and edits only their own row. Inserts are done by the
-- SECURITY DEFINER signup trigger, so no INSERT policy is needed.
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- organizations: members can read; owners/admins can update. Creation happens
-- via the signup trigger (personal orgs); team-org creation comes in a later PR.
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.is_org_member(id));

CREATE POLICY "Admins can update their organizations"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(id))
  WITH CHECK (public.is_org_admin(id));

-- memberships: a user can see their own membership rows. Writes are handled by
-- the signup trigger for now; invite/management flows arrive in a later PR.
CREATE POLICY "Users can view own memberships"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 7. Storage — lock down the 'captures' bucket.
--    Keep the bucket public (asset/thumbnail delivery + the iframe viewer rely
--    on public URLs) but allow only authenticated users to write/delete.
-- ============================================================================

DROP POLICY IF EXISTS "Public read access for captures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload captures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update captures" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete captures" ON storage.objects;

-- Public read stays (bucket is public; viewer/embeds serve assets directly).
CREATE POLICY "Public read access for captures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'captures');

-- Writes now require an authenticated session.
CREATE POLICY "Authenticated can upload captures"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'captures');

CREATE POLICY "Authenticated can update captures"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'captures')
  WITH CHECK (bucket_id = 'captures');

CREATE POLICY "Authenticated can delete captures"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'captures');
