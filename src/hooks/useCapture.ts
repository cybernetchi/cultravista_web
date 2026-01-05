// React Query hooks for KIRI and Capture operations
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KiriService } from '@/services/kiriService';
import { CaptureService } from '@/services/captureService';
import { StorageService } from '@/services/storageService';

// Capture hooks
export const useCaptures = () => {
  return useQuery({
    queryKey: ['captures'],
    queryFn: async () => {
      const result = await CaptureService.getAllCaptures();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

export const useCapture = (id: string) => {
  return useQuery({
    queryKey: ['capture', id],
    queryFn: async () => {
      const result = await CaptureService.getCapture(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
};

export const useCreateCapture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: CaptureService.createCapture,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['captures'] });
      }
    },
  });
};

export const useUpdateCapture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; status?: number; thumbnail?: string; file?: string; serialize?: string; folder_path?: string } }) =>
      CaptureService.updateCapture(id, data),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['captures'] });
        queryClient.invalidateQueries({ queryKey: ['capture', variables.id] });
      }
    },
  });
};

// KIRI upload hook - complete upload flow
export const useKiriUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      files,
      title,
      onProgress,
    }: {
      files: File[];
      title: string;
      onProgress?: (progress: number) => void;
    }) => {
      // Step 1: Generate and upload thumbnail
      let thumbnailUrl: string | undefined;
      const hasVideo = files.some(file => file.type.startsWith('video/'));

      if (onProgress) onProgress(10);

      try {
        if (hasVideo) {
          // Extract video thumbnail
          const thumbnailBlob = await StorageService.extractVideoThumbnail(files[0]);
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const uploadResult = await StorageService.uploadThumbnail(thumbnailBlob, fileName);
          
          if (uploadResult.success && uploadResult.url) {
            thumbnailUrl = uploadResult.url;
          }
        } else {
          // Use first image as thumbnail
          const uploadResult = await StorageService.uploadImageAsThumbnail(files[0]);
          
          if (uploadResult.success && uploadResult.url) {
            thumbnailUrl = uploadResult.url;
          }
        }
      } catch (err) {
        console.error('Thumbnail generation/upload failed:', err);
        // Continue without thumbnail
      }

      if (onProgress) onProgress(20);

      // Step 2: Get KIRI token
      const tokenResult = await KiriService.getToken();
      if (!tokenResult.success || !tokenResult.token) {
        throw new Error(tokenResult.error || 'Failed to get upload token');
      }

      if (onProgress) onProgress(30);

      // Step 3: Upload to KIRI
      const uploadResult = await KiriService.uploadFiles(
        files,
        tokenResult.token,
        (progress) => {
          // Map KIRI progress to 30-80 range
          if (onProgress) onProgress(30 + (progress * 0.5));
        }
      );

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'KIRI upload failed');
      }

      if (onProgress) onProgress(85);

      // Step 4: Create database entry
      const captureResult = await CaptureService.createCapture({
        title: title.trim(),
        thumbnail: thumbnailUrl,
        serialize: uploadResult.data.serialize,
      });

      if (!captureResult.success || !captureResult.data) {
        throw new Error(captureResult.error || 'Failed to create capture');
      }

      if (onProgress) onProgress(100);

      return {
        captureId: captureResult.data.id,
        serialize: uploadResult.data.serialize,
        thumbnail: thumbnailUrl,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captures'] });
    },
  });
};

// KIRI status polling hook
export const useKiriStatus = (serialize: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['kiri-status', serialize],
    queryFn: async () => {
      const result = await KiriService.getStatus(serialize);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: enabled && !!serialize,
    refetchInterval: (query) => {
      // Stop polling if completed or failed
      const status = query.state.data?.status;
      // KIRI status: 0=processing, 1=complete, 2=failed
      return status === 1 || status === 2 ? false : 3000;
    },
  });
};