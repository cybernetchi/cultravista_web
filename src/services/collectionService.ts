// Collection service — collections (museum/exhibition grouping) and the
// many-to-many links between collections and captures. Org-scoped by RLS.
import { supabase } from '@/integrations/supabase/client';
import { resolveOwnerAndOrg } from './orgContext';

export interface Collection {
  id: string;
  org_id: string;
  owner_id: string | null;
  name: string;
  name_zh_hant: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class CollectionService {
  // All collections in the caller's org (RLS limits the result to their org).
  static async getCollections(): Promise<ApiResponse<Collection[]>> {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data ?? [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load collections',
      };
    }
  }

  // Create a collection, stamping owner + personal org (same rule as captures).
  static async createCollection(input: {
    name: string;
    name_zh_hant?: string | null;
    description?: string | null;
  }): Promise<ApiResponse<Collection>> {
    try {
      const scope = await resolveOwnerAndOrg();
      if ('error' in scope) {
        return { success: false, error: scope.error };
      }

      const { data, error } = await supabase
        .from('collections')
        .insert({
          name: input.name,
          name_zh_hant: input.name_zh_hant ?? null,
          description: input.description ?? null,
          owner_id: scope.ownerId,
          org_id: scope.orgId,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create collection',
      };
    }
  }

  // Collection ids a given capture currently belongs to.
  static async getCaptureCollectionIds(
    captureId: string
  ): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('collection_captures')
        .select('collection_id')
        .eq('capture_id', captureId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: (data ?? []).map((r) => r.collection_id) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load capture collections',
      };
    }
  }

  // Reconcile a capture's collection membership to exactly `collectionIds`:
  // insert the newly-added links and delete the removed ones.
  static async setCaptureCollections(
    captureId: string,
    collectionIds: string[]
  ): Promise<ApiResponse<null>> {
    try {
      const currentResult = await CollectionService.getCaptureCollectionIds(captureId);
      if (!currentResult.success) {
        return { success: false, error: currentResult.error };
      }
      const current = new Set(currentResult.data ?? []);
      const next = new Set(collectionIds);

      const toAdd = collectionIds.filter((id) => !current.has(id));
      const toRemove = [...current].filter((id) => !next.has(id));

      if (toAdd.length > 0) {
        const { error } = await supabase
          .from('collection_captures')
          .insert(toAdd.map((collection_id) => ({ collection_id, capture_id: captureId })));
        if (error) {
          return { success: false, error: error.message };
        }
      }

      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('collection_captures')
          .delete()
          .eq('capture_id', captureId)
          .in('collection_id', toRemove);
        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update collections',
      };
    }
  }
}
