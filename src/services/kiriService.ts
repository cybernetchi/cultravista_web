// KIRI API integration service using Supabase Edge Functions
import { supabase } from '@/integrations/supabase/client';

interface KiriUploadResponse {
  success: boolean;
  data?: {
    serialize?: string;
    [key: string]: string | number | boolean | undefined;
  };
  error?: string;
}

interface KiriStatusResponse {
  success: boolean;
  data?: {
    status?: number;
    progress?: number;
    splatUrl?: string;
    [key: string]: string | number | boolean | undefined;
  };
  error?: string;
}

export class KiriService {
  // Get secure token from Supabase Edge Function
  static async getToken(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('kiri-token');

      if (error) {
        console.error('Error getting KIRI token:', error);
        return { success: false, error: error.message };
      }

      return { success: true, token: data.token };
    } catch (error) {
      console.error('Error getting KIRI token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get token',
      };
    }
  }

  // Upload files directly to KIRI API
  static async uploadFiles(
    files: File[],
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<KiriUploadResponse> {
    try {
      const formData = new FormData();
      const hasVideo = files.some(file => file.type.startsWith('video/'));

      if (hasVideo) {
        // Video upload
        formData.append('videoFile', files[0]);
      } else {
        // Image upload
        files.forEach((file) => {
          formData.append('imagesFiles', file);
        });
      }

      formData.append('isMesh', '0');
      formData.append('isMask', '0');

      const endpoint = hasVideo
        ? 'https://api.kiriengine.app/api/v1/open/3dgs/video'
        : 'https://api.kiriengine.app/api/v1/open/3dgs/image';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.msg || 'Upload failed' };
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error uploading to KIRI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Check processing status via Supabase Edge Function
  static async getStatus(serialize: string): Promise<KiriStatusResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('kiri-status', {
        body: { serialize }
      });

      if (error) {
        console.error('Error getting KIRI status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error getting KIRI status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get status',
      };
    }
  }

  // Get model download URL via Supabase Edge Function
  static async getModelZip(serialize: string): Promise<KiriStatusResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('kiri-model-zip', {
        body: { serialize }
      });

      if (error) {
        console.error('Error getting KIRI model:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error getting KIRI model:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get model',
      };
    }
  }

  // Convert PLY to Splat via AWS Lambda (through Supabase Edge Function)
  static async convertPlyToSplat(s3Url: string): Promise<{ success: boolean; data?: { splat_url?: string; output_url?: string; url?: string }; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('ply-to-splat', {
        body: { s3_url: s3Url }
      });

      if (error) {
        console.error('Error converting PLY to Splat:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error converting PLY to Splat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert PLY',
      };
    }
  }
}