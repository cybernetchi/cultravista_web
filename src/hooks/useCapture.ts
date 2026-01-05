// React Query hooks for KIRI and Capture operations
import React from 'react';
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
      // KIRI status: 0=processing, 1=complete, 2=failed (corrected)
      return status === 1 || status === 2 ? false : 5000;
    },
  });
};

// Get model zip URL hook
export const useGetModelZip = () => {
  return useMutation({
    mutationFn: async (serialize: string) => {
      const result = await KiriService.getModelZip(serialize);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
};

// PLY to Splat conversion hook (triggers AWS Lambda)
export const usePlyToSplatConversion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ s3Url, captureId }: { s3Url: string; captureId: string }) => {
      // Call Lambda via Edge Function
      const result = await KiriService.convertPlyToSplat(s3Url);
      if (!result.success) {
        throw new Error(result.error || 'PLY conversion failed');
      }

      // Update capture with the splat URL if conversion succeeded
      if (result.data?.splat_url) {
        await CaptureService.updateCapture(captureId, {
          file: result.data.splat_url,
          status: 1, // Complete
        });
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['captures'] });
    },
  });
};

// Complete processing flow hook - handles status polling and Lambda trigger
export const useProcessingFlow = (
  serialize: string | null,
  captureId: string | null,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();
  const getModelZip = useGetModelZip();
  const convertToSplat = usePlyToSplatConversion();

  // Poll KIRI status
  const statusQuery = useKiriStatus(serialize || '', enabled && !!serialize);
  
  // Auto-trigger conversion when status becomes complete (1)
  React.useEffect(() => {
    const status = statusQuery.data?.status;
    
    if (status === 1 && serialize && captureId && !getModelZip.isPending && !convertToSplat.isPending) {
      // Status is complete, auto-trigger conversion
      console.log('KIRI processing complete (status=1), triggering Lambda conversion:', serialize);
      triggerConversion();
    }
  }, [statusQuery.data?.status, serialize, captureId, getModelZip.isPending, convertToSplat.isPending, triggerConversion]);

  // When status becomes complete (1), trigger the conversion flow
  const triggerConversion = async () => {
    if (!serialize || !captureId) return;

    try {
      // Step 1: Get the model zip URL from KIRI
      const modelData = await getModelZip.mutateAsync(serialize);
      
      if (!modelData?.splatUrl) {
        throw new Error('No model URL returned from KIRI');
      }

      // Step 2: Trigger Lambda conversion
      await convertToSplat.mutateAsync({
        s3Url: modelData.splatUrl,
        captureId,
      });

      queryClient.invalidateQueries({ queryKey: ['captures'] });
    } catch (error) {
      console.error('Conversion flow failed:', error);
      // Update status to failed
      if (captureId) {
        await CaptureService.updateCapture(captureId, { status: 2 });
      }
      throw error;
    }
  };

  return {
    status: statusQuery.data?.status,
    progress: statusQuery.data?.progress,
    isPolling: statusQuery.isFetching,
    isComplete: statusQuery.data?.status === 1,
    isFailed: statusQuery.data?.status === 2,
    isConverting: getModelZip.isPending || convertToSplat.isPending,
    conversionError: getModelZip.error || convertToSplat.error,
    triggerConversion,
  };
};