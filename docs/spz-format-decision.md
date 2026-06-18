# Archival & delivery format decision (PR5)

## Decision

- **Archive:** retain the original **PLY** (lossless, universal interchange) in S3 per capture
  → `captures.ply_url`.
- **Delivery:** ship **SPZ** (Niantic; gzip-compressed gaussian format, ~10× smaller than
  antimatter15 `.splat`, now a glTF `KHR_gaussian_splatting`-adjacent interchange) → `captures.spz_url`.
- **Fallback / current default:** the existing antimatter15 **`.splat`** (`captures.file`) stays
  the delivered format until SPZ rendering is wired into the viewer.
- **SOG** (even smaller web payload) is noted as a *future* optional delivery format; not in PR5.

This keeps a faithful archival master (PLY) while moving delivery toward a compact, standards-
aligned format (SPZ), with a safe fallback so nothing breaks during the transition.

## What PR5 actually ships (repo-side groundwork)

The PLY→SPZ **conversion runs in an external AWS Lambda** (referenced by URL in
`supabase/functions/ply-to-splat/index.ts`; source not in this repo), so PR5 does **not**
perform the conversion. It prepares everything around it:

1. `captures.ply_url` + `captures.spz_url` columns (migration + bootstrap).
2. `ply-to-splat` persists `files.ply` / `files.spz` from the Lambda response when present —
   forward-compatible, a no-op until the Lambda emits them.
3. A `deliverySplatUrl()` helper + `SPZ_RENDERING_ENABLED` flag in `captureService.ts`: when
   the viewer can render SPZ, flip the flag and delivery prefers `spz_url` automatically.
4. This decision doc.

### Lambda output contract (what the external converter must return)

```json
{ "folder_path": "s3://.../<id>", "files": { "splat": "…/output.splat", "ply": "…/source.ply", "spz": "…/output.spz" } }
```

Today the Lambda returns only `files.splat`. To complete the format upgrade it must also
upload and return `files.ply` (the archival original) and `files.spz` (the compact delivery).
No app change is then required — `ply-to-splat` already records both.

## Render-engine evaluation

| Option | SPZ support | Fit with this codebase | Verdict |
|---|---|---|---|
| **r3f + SPZ decoder** (`@spz-loader/core`) | decode SPZ → gaussian data in-browser (WASM), re-pack to `.splat` bytes → Blob URL → existing `<Splat>` | **Reuses everything** — hotspots, tour, GPU picking, auto-framing (all in `GaussianSplatViewer`) stay untouched | **Recommended** |
| **Spark** (three.js-native splat engine) | native SPZ | three-compatible, but a viewer rewrite — PR3/PR4 hotspot/tour/picking would be re-implemented | Revisit if client decode is too costly at scale |
| **PlayCanvas** (SuperSplat ecosystem) | native SPZ | non-three engine — largest rewrite, diverges from the r3f stack | Not now |

### Spike result (validates the recommendation)

Decoded Niantic's sample `samples/hornedlizard.spz` (18 MB) with `@spz-loader/core@0.3.1`
**in-browser**: **786,233 gaussians** with full data (`positions`, `scales`, `rotations`,
`alphas`, `colors`, `sh`). So the decoder path is proven for our stack.

Notes:
- The decoder is **browser-targeted** (emscripten WASM). It does **not** run under Bun/Node
  here (an emscripten `createRequire` quirk) — irrelevant, since it runs in the viewer.
- A capture pipeline (KIRI scenes) is typically much smaller than this 18 MB sample.

## How to turn SPZ delivery on (future, once the Lambda emits SPZ)

1. Integrate `@spz-loader/core` into `GaussianSplatViewer`: when the source URL is `.spz`,
   `loadSpz()` → re-pack to antimatter15 `.splat` (32 bytes/point: xyz f32, scale f32×3,
   rgba u8, quat u8×4) → `URL.createObjectURL(blob)` → feed the existing `<Splat>` +
   `useSplatData` (so framing/picking keep working unchanged).
2. Set `SPZ_RENDERING_ENABLED = true` in `captureService.ts`.
3. `deliverySplatUrl()` then prefers `spz_url` automatically; PLY remains the archive.
