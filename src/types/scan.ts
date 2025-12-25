export interface Scan {
  id: string;
  title: string;
  author: string;
  authorHandle: string;
  thumbnail: string;
  createdAt: Date;
  location?: string;
}

export type ViewMode = 'library' | 'detail' | 'edit' | 'annotate' | 'capture';

export type CaptureState = 'pre' | 'capturing' | 'processing' | 'complete';
