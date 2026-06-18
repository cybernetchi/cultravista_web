// Annotation service — 3D hotspots on a capture (PR3). Org-scoped by RLS via the
// parent capture. Positions are stored in rendered world space.
import { supabase } from '@/integrations/supabase/client';
import type { Annotation } from '@/types/scan';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Shape a caller passes when creating/updating an annotation (no ids/owner).
export interface AnnotationInput {
  position: [number, number, number];
  cameraPose?: Annotation['cameraPose'];
  title?: string | null;
  titleZhHant?: string | null;
  body?: string | null;
  bodyZhHant?: string | null;
  orderIndex?: number;
}

// Map a DB row to the UI Annotation type.
type Row = {
  id: string;
  position_x: number;
  position_y: number;
  position_z: number;
  camera_pose: unknown;
  title: string | null;
  title_zh_hant: string | null;
  body: string | null;
  body_zh_hant: string | null;
  order_index: number;
};

function rowToAnnotation(r: Row): Annotation {
  return {
    id: r.id,
    position: [r.position_x, r.position_y, r.position_z],
    cameraPose: (r.camera_pose as Annotation['cameraPose']) ?? null,
    title: r.title,
    titleZhHant: r.title_zh_hant,
    body: r.body,
    bodyZhHant: r.body_zh_hant,
    orderIndex: r.order_index,
  };
}

export class AnnotationService {
  // All hotspots for a capture, in tour order.
  static async getAnnotations(captureId: string): Promise<ApiResponse<Annotation[]>> {
    try {
      const { data, error } = await supabase
        .from('annotations')
        .select('*')
        .eq('capture_id', captureId)
        .order('order_index', { ascending: true });

      if (error) return { success: false, error: error.message };
      return { success: true, data: (data ?? []).map(rowToAnnotation) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load annotations',
      };
    }
  }

  // Create a hotspot, stamping owner_id from the current session.
  static async createAnnotation(
    captureId: string,
    input: AnnotationInput
  ): Promise<ApiResponse<Annotation>> {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'You must be signed in.' };
      }

      const { data, error } = await supabase
        .from('annotations')
        .insert({
          capture_id: captureId,
          owner_id: user.id,
          position_x: input.position[0],
          position_y: input.position[1],
          position_z: input.position[2],
          camera_pose: input.cameraPose ?? null,
          title: input.title ?? null,
          title_zh_hant: input.titleZhHant ?? null,
          body: input.body ?? null,
          body_zh_hant: input.bodyZhHant ?? null,
          order_index: input.orderIndex ?? 0,
        })
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: rowToAnnotation(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create annotation',
      };
    }
  }

  static async updateAnnotation(
    id: string,
    input: AnnotationInput
  ): Promise<ApiResponse<Annotation>> {
    try {
      const { data, error } = await supabase
        .from('annotations')
        .update({
          position_x: input.position[0],
          position_y: input.position[1],
          position_z: input.position[2],
          camera_pose: input.cameraPose ?? null,
          title: input.title ?? null,
          title_zh_hant: input.titleZhHant ?? null,
          body: input.body ?? null,
          body_zh_hant: input.bodyZhHant ?? null,
          order_index: input.orderIndex ?? 0,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data: rowToAnnotation(data) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update annotation',
      };
    }
  }

  static async deleteAnnotation(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from('annotations').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete annotation',
      };
    }
  }

  // Persist a new ordering by writing each id's order_index.
  static async reorderAnnotations(orderedIds: string[]): Promise<ApiResponse<null>> {
    try {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('annotations').update({ order_index: index }).eq('id', id)
        )
      );
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reorder annotations',
      };
    }
  }
}
