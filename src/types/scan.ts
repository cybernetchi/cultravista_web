export interface Scan {
  id: string;
  title: string;
  author: string;
  authorHandle: string;
  thumbnail: string;
  createdAt: Date;
  location?: string;
  splatUrl?: string; // URL to the .splat file for Gaussian Splatting
  status?: number; // 0=processing, 1=complete, 2=failed (DB status)
  folderPath?: string; // S3 folder path where splat file is stored
}

export type ViewMode = 'library' | 'detail' | 'edit' | 'annotate' | 'capture';

export type CaptureState = 'idle' | 'pre' | 'capturing' | 'processing' | 'complete';
