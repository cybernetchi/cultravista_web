import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import { Splat, OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Move3D, Eye, ZoomIn, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Annotation } from "@/types/scan";

interface GaussianSplatViewerProps {
  src: string;
  className?: string;
  onClose?: () => void;
  title?: string;
  /** Hotspots to render as markers. */
  annotations?: Annotation[];
  /** "edit" enables click-to-place; "view" is read-only. */
  mode?: "view" | "edit";
  selectedId?: string | null;
  onSelectAnnotation?: (id: string) => void;
  /** Called in edit mode when the user clicks the object to drop a marker. */
  onPlacePoint?: (p: [number, number, number]) => void;
  /** When set, fly the camera to this annotation index (tour playback). */
  tourIndex?: number | null;
  /** Receives the current camera pose (for "set camera view"). */
  onCameraPoseRef?: (getter: () => Annotation["cameraPose"]) => void;
}

// Remote (http) splats must be loaded through the Supabase `proxy` edge function:
// S3 serves the file but without an Access-Control-Allow-Origin header, so a
// direct browser fetch is blocked by CORS. The proxy re-serves it with CORS
// headers. Same-origin/relative URLs (e.g. local sample splats) pass through.
function resolveSplatUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) {
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL || "https://gwtfkqkcvdqpccyglaff.supabase.co";
    return `${supabaseUrl}/functions/v1/proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

interface SplatBounds {
  center: [number, number, number];
  radius: number;
}

interface SplatData {
  bounds: SplatBounds;
  // All point positions in rendered (flipped) world space, packed xyz.
  points: Float32Array;
}

// drei's <Splat> keeps point positions in instanced attributes, so a normal
// bounding-box can't measure it. Instead we parse the .splat file ourselves
// (antimatter15 format: 32 bytes/point, xyz float32 at offset 0).
//
// KIRI captures include the whole room, so the *mean* center and a high
// percentile radius frame the entire scene and leave the object of interest
// tiny. Instead we use the per-axis MEDIAN as the center (lands in the dense
// object cluster, ignoring far background) and a small multiple of the MEDIAN
// radial distance as the framing radius (the dense core), so the camera frames
// the object and lets the sparse background fall outside the view.
function useSplatData(src: string): SplatData | null {
  const [data, setData] = useState<SplatData | null>(null);

  useEffect(() => {
    let active = true;
    setData(null);

    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!active) return;
        const ROW = 32;
        const count = Math.floor(buf.byteLength / ROW);
        if (count === 0) return;
        const dv = new DataView(buf);

        const xs = new Float64Array(count);
        const ys = new Float64Array(count);
        const zs = new Float64Array(count);
        for (let i = 0; i < count; i++) {
          const o = i * ROW;
          xs[i] = dv.getFloat32(o, true);
          ys[i] = dv.getFloat32(o + 4, true);
          zs[i] = dv.getFloat32(o + 8, true);
        }

        const median = (arr: Float64Array) => {
          const sorted = Float64Array.from(arr).sort();
          return sorted[Math.floor(count / 2)];
        };
        const cx = median(xs), cy = median(ys), cz = median(zs);

        const dists = new Float64Array(count);
        for (let i = 0; i < count; i++) {
          const dx = xs[i] - cx, dy = ys[i] - cy, dz = zs[i] - cz;
          dists[i] = Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        dists.sort();
        const medianRadial = dists[Math.floor(count * 0.5)] || 1;
        const radius = medianRadial * 1.8;

        // Keep the points (in rendered, flipped space) so click-to-place can
        // snap a hotspot onto the nearest real surface point along the click ray.
        const points = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          points[3 * i] = xs[i];
          points[3 * i + 1] = -ys[i];
          points[3 * i + 2] = -zs[i];
        }

        setData({ bounds: { center: [cx, cy, cz], radius }, points });
      })
      .catch(() => {
        /* leave defaults; the splat still renders, just not auto-framed */
      });

    return () => {
      active = false;
    };
  }, [src]);

  return data;
}

// Given a click ray and the splat point cloud (rendered space), return the
// front-most real surface point near the ray — so a hotspot anchors to actual
// geometry and stays put as the camera moves.
function findSurfacePoint(
  ray: { origin: Vector3; direction: Vector3 },
  points: Float32Array,
  threshold: number
): [number, number, number] | null {
  const ox = ray.origin.x, oy = ray.origin.y, oz = ray.origin.z;
  const dx = ray.direction.x, dy = ray.direction.y, dz = ray.direction.z;
  const t2 = threshold * threshold;
  const n = points.length / 3;

  let bestT = Infinity, bestIdx = -1; // nearest-camera point within threshold
  let fbPerp = Infinity, fbIdx = -1; // global closest-to-ray fallback

  for (let i = 0; i < n; i++) {
    const px = points[3 * i] - ox;
    const py = points[3 * i + 1] - oy;
    const pz = points[3 * i + 2] - oz;
    const t = px * dx + py * dy + pz * dz; // projection along the ray
    if (t <= 0) continue; // behind the camera
    const perp2 = px * px + py * py + pz * pz - t * t;
    if (perp2 < fbPerp) { fbPerp = perp2; fbIdx = i; }
    if (perp2 < t2 && t < bestT) { bestT = t; bestIdx = i; }
  }

  const idx = bestIdx >= 0 ? bestIdx : fbIdx;
  if (idx < 0) return null;
  return [points[3 * idx], points[3 * idx + 1], points[3 * idx + 2]];
}

// The rendered center accounts for drei's 180°-about-X load flip (Y/Z negated).
function renderedCenter(bounds: SplatBounds | null): Vector3 {
  if (!bounds) return new Vector3(0, 0, 0);
  return new Vector3(bounds.center[0], -bounds.center[1], -bounds.center[2]);
}

// Frame the camera/orbit pivot on the object once bounds are known.
function CameraRig({ bounds }: { bounds: SplatBounds | null }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as
    | { target: { set: (x: number, y: number, z: number) => void }; update: () => void }
    | null;

  useEffect(() => {
    if (!bounds) return;
    const c = renderedCenter(bounds);
    const fovRad = (50 * Math.PI) / 180;
    const dist = (bounds.radius / Math.sin(fovRad / 2)) * 0.8;

    camera.position.set(c.x, c.y, c.z + dist);
    camera.near = Math.max(dist / 1000, 0.001);
    camera.far = dist * 100;
    camera.updateProjectionMatrix();

    if (controls?.target) {
      controls.target.set(c.x, c.y, c.z);
      controls.update();
    }
  }, [bounds, camera, controls]);

  return null;
}

// Renders a numbered marker per annotation as a screen-space dot button.
function Markers({
  annotations,
  selectedId,
  onSelect,
}: {
  annotations: Annotation[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <>
      {annotations.map((a, i) => (
        <Html key={a.id} position={a.position} center zIndexRange={[100, 0]} occlude={false}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(a.id);
            }}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg transition-transform hover:scale-110",
              selectedId === a.id
                ? "border-white bg-primary text-primary-foreground scale-110"
                : "border-white/80 bg-primary/80 text-primary-foreground"
            )}
            title={a.title ?? `Hotspot ${i + 1}`}
          >
            {i + 1}
          </button>
        </Html>
      ))}
    </>
  );
}

// Invisible bounding sphere used as a raycast proxy for click-to-place, since
// Gaussian splats themselves can't be reliably raycast.
function PlacementTarget({
  bounds,
  points,
  onPlace,
}: {
  bounds: SplatBounds | null;
  points: Float32Array | null;
  onPlace: (p: [number, number, number]) => void;
}) {
  if (!bounds) return null;
  const c = renderedCenter(bounds);
  return (
    <mesh
      position={[c.x, c.y, c.z]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        // e.delta distinguishes a click from an orbit drag.
        if (e.delta > 6) return;
        e.stopPropagation();
        // Snap to the nearest real surface point along the click ray; fall back
        // to the sphere intersection if the cloud isn't available.
        const snapped = points
          ? findSurfacePoint(e.ray, points, bounds.radius * 0.08)
          : null;
        onPlace(snapped ?? [e.point.x, e.point.y, e.point.z]);
      }}
    >
      <sphereGeometry args={[bounds.radius * 1.4, 32, 32]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// Flies the camera to the active tour stop; frees orbit when tourIndex is null.
function TourController({
  annotations,
  tourIndex,
  bounds,
}: {
  annotations: Annotation[];
  tourIndex: number | null | undefined;
  bounds: SplatBounds | null;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as
    | { target: Vector3; update: () => void; enabled: boolean }
    | null;
  const goal = useRef<{ pos: Vector3; tgt: Vector3 } | null>(null);

  useEffect(() => {
    const active = tourIndex != null && annotations[tourIndex];
    if (!active) {
      goal.current = null;
      if (controls) controls.enabled = true;
      return;
    }
    const a = annotations[tourIndex as number];
    const center = renderedCenter(bounds);
    const marker = new Vector3(a.position[0], a.position[1], a.position[2]);

    let pos: Vector3;
    let tgt: Vector3;
    if (a.cameraPose) {
      pos = new Vector3(...a.cameraPose.position);
      tgt = new Vector3(...a.cameraPose.target);
    } else {
      tgt = marker.clone();
      const dir = marker.clone().sub(center);
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
      dir.normalize();
      const d = (bounds?.radius ?? 1) * 1.4;
      pos = marker.clone().add(dir.multiplyScalar(d));
      pos.y += (bounds?.radius ?? 1) * 0.15;
    }
    goal.current = { pos, tgt };
    if (controls) controls.enabled = false;
  }, [tourIndex, annotations, bounds, controls]);

  useFrame(() => {
    const g = goal.current;
    if (!g || !controls) return;
    camera.position.lerp(g.pos, 0.08);
    controls.target.lerp(g.tgt, 0.08);
    controls.update();
  });

  return null;
}

// Exposes a getter for the current camera pose (used by "set camera view").
function CameraPoseProbe({
  onReady,
}: {
  onReady: (getter: () => Annotation["cameraPose"]) => void;
}) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: Vector3 } | null;

  useEffect(() => {
    onReady(() => ({
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: controls?.target
        ? [controls.target.x, controls.target.y, controls.target.z]
        : [0, 0, 0],
    }));
  }, [camera, controls, onReady]);

  return null;
}

function SplatScene({
  src,
  annotations,
  mode,
  selectedId,
  onSelectAnnotation,
  onPlacePoint,
  tourIndex,
  onCameraPoseRef,
}: {
  src: string;
  annotations: Annotation[];
  mode: "view" | "edit";
  selectedId?: string | null;
  onSelectAnnotation?: (id: string) => void;
  onPlacePoint?: (p: [number, number, number]) => void;
  tourIndex?: number | null;
  onCameraPoseRef?: (getter: () => Annotation["cameraPose"]) => void;
}) {
  // Route remote splats through the CORS-enabling proxy before loading/parsing.
  const loadUrl = resolveSplatUrl(src);
  const data = useSplatData(loadUrl);
  const bounds = data?.bounds ?? null;
  const points = data?.points ?? null;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={50} />
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.1}
        minDistance={0.01}
        maxDistance={100000}
      />
      <CameraRig bounds={bounds} />
      <TourController annotations={annotations} tourIndex={tourIndex} bounds={bounds} />
      {onCameraPoseRef && <CameraPoseProbe onReady={onCameraPoseRef} />}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Suspense fallback={null}>
        <Splat src={loadUrl} alphaTest={0.1} position={[0, 0, 0]} />
      </Suspense>
      {mode === "edit" && onPlacePoint && (
        <PlacementTarget bounds={bounds} points={points} onPlace={onPlacePoint} />
      )}
      <Markers annotations={annotations} selectedId={selectedId} onSelect={onSelectAnnotation} />
    </>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
      <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
      <p className="text-foreground font-medium">Loading Gaussian Splat...</p>
      <p className="text-muted-foreground text-sm mt-1">This may take a moment</p>
    </div>
  );
}

export function GaussianSplatViewer({
  src,
  className,
  title = "3D Viewer",
  annotations = [],
  mode = "view",
  selectedId = null,
  onSelectAnnotation,
  onPlacePoint,
  tourIndex = null,
  onCameraPoseRef,
}: GaussianSplatViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className={cn(
      "relative bg-background border border-border rounded-lg overflow-hidden",
      isFullscreen && "fixed inset-4 z-50",
      className
    )}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-background/90 to-transparent">
        <div className="flex items-center gap-2">
          <Move3D className="w-5 h-5 text-accent" />
          <span className="text-foreground font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Edit-mode hint */}
      {mode === "edit" && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border text-xs text-muted-foreground">
          Click the object to place a hotspot
        </div>
      )}

      {/* Canvas */}
      <div className="w-full h-full min-h-[400px]">
        {isLoading && <LoadingOverlay />}
        <Canvas
          gl={{ antialias: true, alpha: true }}
          onCreated={() => setTimeout(() => setIsLoading(false), 1500)}
          className="w-full h-full"
        >
          <SplatScene
            src={src}
            annotations={annotations}
            mode={mode}
            selectedId={selectedId}
            onSelectAnnotation={onSelectAnnotation}
            onPlacePoint={onPlacePoint}
            tourIndex={tourIndex}
            onCameraPoseRef={onCameraPoseRef}
          />
        </Canvas>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-background/90 to-transparent">
        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-card/80 backdrop-blur-sm rounded-full border border-border">
            <Eye className="w-4 h-4 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">Drag to rotate</span>
            <span className="text-border mx-2">•</span>
            <ZoomIn className="w-4 h-4 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">Scroll to zoom</span>
            <span className="text-border mx-2">•</span>
            <Move3D className="w-4 h-4 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">Right-drag to pan</span>
          </div>
        </div>
      </div>

      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm -z-10"
          onClick={toggleFullscreen}
        />
      )}
    </div>
  );
}
