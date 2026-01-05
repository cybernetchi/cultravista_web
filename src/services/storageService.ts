// Storage service using Supabase Storage for file uploads
import { supabase } from '@/lib/supabase';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class StorageService {
  // Upload thumbnail to Supabase Storage
  static async uploadThumbnail(file: File | Blob, fileName: string): Promise<UploadResult> {
    try {
      const filePath = `thumbnails/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('captures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('captures')
        .getPublicUrl(filePath);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Generate thumbnail from video
  static async extractVideoThumbnail(videoFile: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Seek to 1 second
        video.currentTime = 1;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => {
            URL.revokeObjectURL(video.src);
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail blob'));
            }
          }, 'image/jpeg', 0.8);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Video load error'));
      };

      video.src = URL.createObjectURL(videoFile);
      video.load();
    });
  }

  // Upload file buffer (for images used as thumbnails)
  static async uploadImageAsThumbnail(imageFile: File): Promise<UploadResult> {
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    return this.uploadThumbnail(imageFile, fileName);
  }
}