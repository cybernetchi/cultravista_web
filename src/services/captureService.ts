// Capture service using Supabase Database
import { supabase } from '@/integrations/supabase/client';
import { resolveOwnerAndOrg } from './orgContext';

export interface Capture {
  id: string;
  title: string; // canonical English title
  status: number; // DB status: 0=processing, 1=complete, 2=failed (Note: differs from KIRI API status)
  thumbnail: string | null;
  file: string | null;
  serialize: string | null;
  folder_path: string | null;
  owner_id: string | null; // auth.users id of the creator (set by RLS-scoped insert)
  org_id: string | null; // organization the capture is scoped to
  // PR2 archival metadata
  title_zh_hant: string | null;
  description: string | null;
  description_zh_hant: string | null;
  capture_date: string | null; // ISO date (YYYY-MM-DD)
  location_text: string | null;
  lat: number | null;
  lng: number | null;
  rights_license: string | null;
  attribution: string | null;
  tags: string[];
  source: string; // 'kiri' | 'upload'
  created_at: string;
  updated_at: string;
}

// Fields a caller may set when creating/updating a capture. owner_id/org_id are
// stamped by the service, not the caller.
interface CaptureMetadata {
  title_zh_hant?: string | null;
  description?: string | null;
  description_zh_hant?: string | null;
  capture_date?: string | null;
  location_text?: string | null;
  lat?: number | null;
  lng?: number | null;
  rights_license?: string | null;
  attribution?: string | null;
  tags?: string[];
}

interface CaptureInsert extends CaptureMetadata {
  title: string;
  status?: number;
  thumbnail?: string;
  file?: string;
  serialize?: string;
  folder_path?: string;
  source?: string;
}

interface CaptureUpdate extends CaptureMetadata {
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
  // Create new capture
  static async createCapture(data: CaptureInsert): Promise<ApiResponse<Capture>> {
    try {
      const scope = await resolveOwnerAndOrg();
      if ('error' in scope) {
        return { success: false, error: scope.error };
      }

      const { data: capture, error } = await supabase
        .from('captures')
        .insert({
          ...data,
          status: data.status ?? 0, // 0 = processing
          source: data.source ?? 'kiri',
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