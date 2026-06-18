// Resolves the current user's id and personal organization id. Captures and
// collections are owner/org-scoped by RLS, so inserts must carry both. Shared
// by captureService and collectionService.
import { supabase } from '@/integrations/supabase/client';

export type OwnerAndOrg =
  | { ownerId: string; orgId: string }
  | { error: string };

export async function resolveOwnerAndOrg(): Promise<OwnerAndOrg> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'You must be signed in.' };
  }

  const { data: memberships, error: orgError } = await supabase
    .from('memberships')
    .select('org_id, organizations!inner(is_personal)')
    .eq('user_id', user.id);

  if (orgError) {
    return { error: 'Failed to resolve your organization.' };
  }

  const personalOrgId = memberships?.find(
    (m) => m.organizations?.is_personal
  )?.org_id;

  if (!personalOrgId) {
    return { error: 'No personal organization found for this user.' };
  }

  return { ownerId: user.id, orgId: personalOrgId };
}
