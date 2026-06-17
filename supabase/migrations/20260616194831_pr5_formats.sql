-- PR5 — Archival format groundwork
-- Track an archival PLY URL + an SPZ delivery URL per capture. `file` stays the
-- current .splat delivery URL (default/fallback). Populated by ply-to-splat once
-- the conversion Lambda emits these formats. Safe to run as-is in the SQL Editor.

ALTER TABLE public.captures
  ADD COLUMN IF NOT EXISTS ply_url TEXT,  -- archival original PLY in S3
  ADD COLUMN IF NOT EXISTS spz_url TEXT;  -- SPZ delivery file in S3
