export interface Scan {
  id: string;
  title: string; // canonical English title
  author: string;
  authorHandle: string;
  thumbnail: string;
  createdAt: Date;
  location?: string;
  splatUrl?: string; // URL to the .splat file for Gaussian Splatting
  status?: number; // 0=processing, 1=complete, 2=failed (DB status)
  folderPath?: string; // S3 folder path where splat file is stored
  // PR2 archival metadata
  titleZhHant?: string | null;
  description?: string | null;
  descriptionZhHant?: string | null;
  captureDate?: string | null; // ISO date (YYYY-MM-DD)
  locationText?: string | null;
  lat?: number | null;
  lng?: number | null;
  rightsLicense?: string | null;
  attribution?: string | null;
  tags?: string[];
  source?: string;
}

// A 3D hotspot anchored on a capture (PR3). Positions are rendered world-space.
export interface Annotation {
  id: string;
  position: [number, number, number];
  cameraPose?: { position: [number, number, number]; target: [number, number, number] } | null;
  title?: string | null;
  titleZhHant?: string | null;
  body?: string | null;
  bodyZhHant?: string | null;
  orderIndex: number;
}

export type ViewMode = 'library' | 'detail' | 'edit' | 'annotate' | 'capture';

export type CaptureState = 'idle' | 'pre' | 'capturing' | 'processing' | 'complete';
