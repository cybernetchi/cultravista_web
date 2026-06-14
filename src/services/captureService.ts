// Capture service using Supabase Database
import { supabase } from '@/integrations/supabase/client';

export interface Capture {
  id: string;
  title: string;
  status: number; // DB status: 0=processing, 1=complete, 2=failed (Note: differs from KIRI API status)
  thumbnail: string | null;
  file: string | null;
  serialize: string | null;
  folder_path: string | null;
  owner_id: string | null; // auth.users id of the creator (set by RLS-scoped insert)
  org_id: string | null; // organization the capture is scoped to
  created_at: string;
  updated_at: string;
}

interface CaptureInsert {
  title: string;
  status?: number;
  thumbnail?: string;
  file?: string;
  serialize?: string;
  folder_path?: string;
}

interface CaptureUpdate {
  title?: string;
  status?: number;
  thumbnail?: string;
  file?: string;
  serialize?: string;
  folder_path?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class CaptureService {
  // Resolve the current user's id and personal organization id. Captures are
  // owner/org-scoped by RLS, so every insert must carry both.
  private static async resolveOwnerAndOrg(): Promise<
    { ownerId: string; orgId: string } | { error: string }
  > {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { error: 'You must be signed in to create a capture.' };
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

  // Create new capture
  static async createCapture(data: CaptureInsert): Promise<ApiResponse<Capture>> {
    try {
      const scope = await CaptureService.resolveOwnerAndOrg();
      if ('error' in scope) {
        return { success: false, error: scope.error };
      }

      const { data: capture, error } = await supabase
        .from('captures')
        .insert({
          title: data.title,
          status: data.status ?? 0, // 0 = processing
          thumbnail: data.thumbnail,
          serialize: data.serialize,
          file: data.file,
          folder_path: data.folder_path,
          owner_id: scope.ownerId,
          org_id: scope.orgId,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating capture:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: capture };
    } catch (error) {
      console.error('Error creating capture:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create capture',
      };
    }
  }

  // Update existing capture
  static async updateCapture(id: string, data: CaptureUpdate): Promise<ApiResponse<Capture>> {
    try {
      const { data: capture, error } = await supabase
        .from('captures')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating capture:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: capture };
    } catch (error) {
      console.error('Error updating capture:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update capture',
      };
    }
  }

  // Get single capture
  static async getCapture(id: string): Promise<ApiResponse<Capture>> {
    try {
      const { data: capture, error } = await supabase
        .from('captures')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error getting capture:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: capture };
    } catch (error) {
      console.error('Error getting capture:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get capture',
      };
    }
  }

  // Get all captures
  static async getAllCaptures(): Promise<ApiResponse<Capture[]>> {
    try {
      const { data: captures, error } = await supabase
        .from('captures')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting captures:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: captures };
    } catch (error) {
      console.error('Error getting captures:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get captures',
      };
    }
  }
}