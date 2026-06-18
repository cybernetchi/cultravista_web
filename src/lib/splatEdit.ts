// Client-side editing of antimatter15 .splat data (32 bytes/point):
//   bytes  0..11  position xyz   (3 × float32)
//   bytes 12..23  scale xyz      (3 × float32)
//   bytes 24..27  color rgba     (4 × uint8)
//   bytes 28..31  rotation quat  (4 × uint8)
//
// All operations are SUBTRACTIVE — they only drop whole points and never move
// the points they keep — so coordinates are preserved and PR3 hotspots stay
// valid. Kept rows are copied verbatim, so the output is a valid .splat that
// re-flips correctly when drei's loader applies its 180°-about-X transform.

export const SPLAT_ROW = 32;

export interface CropBox {
  // Bounds in RENDERED world space (the space the viewer/hotspots use).
  min: [number, number, number];
  max: [number, number, number];
}

export interface CropOptions {
  /** Keep only points inside this box (rendered space). Omit to skip cropping. */
  box?: CropBox;
  /** Drop points farther than this from the median center. Omit to skip. */
  maxRadial?: number;
}

export interface CropResult {
  data: Uint8Array; // edited .splat bytes
  kept: number;
  total: number;
}

// A row's rendered position is the raw file position with Y and Z negated
// (drei SplatLoader rotates 180° about X on load).
function renderedXYZ(dv: DataView, offset: number): [number, number, number] {
  return [dv.getFloat32(offset, true), -dv.getFloat32(offset + 4, true), -dv.getFloat32(offset + 8, true)];
}

// Per-axis median center of all points, in rendered space — robust to the
// far-flung background points a room capture contains.
export function medianCenter(buffer: ArrayBuffer): [number, number, number] {
  const dv = new DataView(buffer);
  const n = Math.floor(buffer.byteLength / SPLAT_ROW);
  const xs = new Float64Array(n), ys = new Float64Array(n), zs = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = renderedXYZ(dv, i * SPLAT_ROW);
    xs[i] = x; ys[i] = y; zs[i] = z;
  }
  const med = (a: Float64Array) => {
    const b = Float64Array.from(a).sort();
    return b[Math.floor(n / 2)] ?? 0;
  };
  return [med(xs), med(ys), med(zs)];
}

// Radial distance percentiles from the median center (rendered space) — used to
// pick a sensible "remove floaters" range (the dense object vs. far outliers).
export function radialPercentiles(
  buffer: ArrayBuffer,
  ps: number[]
): { center: [number, number, number]; values: number[] } {
  const center = medianCenter(buffer);
  const dv = new DataView(buffer);
  const n = Math.floor(buffer.byteLength / SPLAT_ROW);
  const d = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = renderedXYZ(dv, i * SPLAT_ROW);
    const dx = x - center[0], dy = y - center[1], dz = z - center[2];
    d[i] = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  d.sort();
  return { center, values: ps.map((p) => d[Math.min(n - 1, Math.floor(n * p))] ?? 0) };
}

// Filter points by an optional crop box and/or an optional max radial distance
// from the median center. Returns the edited bytes plus kept/total counts.
export function cropAndClean(buffer: ArrayBuffer, opts: CropOptions): CropResult {
  const dv = new DataView(buffer);
  const src = new Uint8Array(buffer);
  const total = Math.floor(buffer.byteLength / SPLAT_ROW);

  const [cx, cy, cz] = opts.maxRadial != null ? medianCenter(buffer) : [0, 0, 0];
  const maxR2 = opts.maxRadial != null ? opts.maxRadial * opts.maxRadial : Infinity;
  const box = opts.box;

  // Collect indices of kept rows.
  const keep: number[] = [];
  for (let i = 0; i < total; i++) {
    const o = i * SPLAT_ROW;
    const [x, y, z] = renderedXYZ(dv, o);

    if (box) {
      if (x < box.min[0] || x > box.max[0]) continue;
      if (y < box.min[1] || y > box.max[1]) continue;
      if (z < box.min[2] || z > box.max[2]) continue;
    }
    if (opts.maxRadial != null) {
      const dx = x - cx, dy = y - cy, dz = z - cz;
      if (dx * dx + dy * dy + dz * dz > maxR2) continue;
    }
    keep.push(i);
  }

  const out = new Uint8Array(keep.length * SPLAT_ROW);
  for (let k = 0; k < keep.length; k++) {
    const o = keep[k] * SPLAT_ROW;
    out.set(src.subarray(o, o + SPLAT_ROW), k * SPLAT_ROW);
  }

  return { data: out, kept: keep.length, total };
}

// Count how many points an edit would keep, without allocating the output —
// for live "kept N / total" feedback while dragging the crop box.
export function countKept(buffer: ArrayBuffer, opts: CropOptions): { kept: number; total: number } {
  const dv = new DataView(buffer);
  const total = Math.floor(buffer.byteLength / SPLAT_ROW);
  const [cx, cy, cz] = opts.maxRadial != null ? medianCenter(buffer) : [0, 0, 0];
  const maxR2 = opts.maxRadial != null ? opts.maxRadial * opts.maxRadial : Infinity;
  const box = opts.box;
  let kept = 0;
  for (let i = 0; i < total; i++) {
    const o = i * SPLAT_ROW;
    const [x, y, z] = renderedXYZ(dv, o);
    if (box) {
      if (x < box.min[0] || x > box.max[0] || y < box.min[1] || y > box.max[1] || z < box.min[2] || z > box.max[2]) continue;
    }
    if (opts.maxRadial != null) {
      const dx = x - cx, dy = y - cy, dz = z - cz;
      if (dx * dx + dy * dy + dz * dz > maxR2) continue;
    }
    kept++;
  }
  return { kept, total };
}
