import { Canvas, useThree } from "@react-three/fiber";
import { Splat, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2,
  Move3D,
  Eye,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GaussianSplatViewerProps {
  src: string;
  className?: string;
  onClose?: () => void;
  title?: string;
}

interface SplatBounds {
  center: [number, number, number];
  radius: number;
}

// drei's <Splat> keeps point positions in instanced attributes, so a normal
// bounding-box can't measure it. Instead we parse the .splat file ourselves
// (antimatter15 format: 32 bytes/point, xyz float32 at offset 0) to find the
// true centroid + spread, which we use to aim the camera and orbit pivot.
function useSplatBounds(src: string): SplatBounds | null {
  const [bounds, setBounds] = useState<SplatBounds | null>(null);

  useEffect(() => {
    let active = true;
    setBounds(null);

    fetch(src)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!active) return;
        const ROW = 32;
        const count = Math.floor(buf.byteLength / ROW);
        if (count === 0) return;
        const dv = new DataView(buf);

        // Pass 1: centroid (mean position) — stable against a few stray points.
        let sx = 0, sy = 0, sz = 0;
        for (let i = 0; i < count; i++) {
          const o = i * ROW;
          sx += dv.getFloat32(o, true);
          sy += dv.getFloat32(o + 4, true);
          sz += dv.getFloat32(o + 8, true);
        }
        const cx = sx / count, cy = sy / count, cz = sz / count;

        // Pass 2: radial distance per point, then take the 90th percentile as
        // the framing radius. Using a percentile (not max/bbox) ignores the
        // stray outlier points splats often have, while reflecting true extent.
        const dists = new Float64Array(count);
        for (let i = 0; i < count; i++) {
          const o = i * ROW;
          const dx = dv.getFloat32(o, true) - cx;
          const dy = dv.getFloat32(o + 4, true) - cy;
          const dz = dv.getFloat32(o + 8, true) - cz;
          dists[i] = Math.sqrt(dx * dx + dy * dy + dz * dz);
        }
        dists.sort();
        const radius = dists[Math.floor(count * 0.9)] || 1;

        setBounds({ center: [cx, cy, cz], radius });
      })
      .catch(() => {
        /* leave defaults; the splat still renders, just not auto-framed */
      });

    return () => {
      active = false;
    };
  }, [src]);

  return bounds;
}

// Once bounds are known, place the camera and the orbit target on the object's
// real center and call controls.update() so OrbitControls re-derives its orbit
// from the new framing.
function CameraRig({ bounds }: { bounds: SplatBounds | null }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as
    | { target: { set: (x: number, y: number, z: number) => void }; update: () => void }
    | null;

  useEffect(() => {
    if (!bounds) return;
    // drei's SplatLoader rotates splats 180° about X (Y-down -> Y-up), so the
    // rendered center is the raw centroid with Y and Z negated.
    const [rx, ry, rz] = [bounds.center[0], -bounds.center[1], -bounds.center[2]];
    // Distance to fit `radius` in a 50° vertical FOV: r / sin(fov/2).
    // The 0.8 factor frames a bit tighter so the object fills the view.
    const fovRad = (50 * Math.PI) / 180;
    const dist = (bounds.radius / Math.sin(fovRad / 2)) * 0.8;

    camera.position.set(rx, ry, rz + dist);
    camera.near = Math.max(dist / 1000, 0.001);
    camera.far = dist * 100;
    camera.updateProjectionMatrix();

    if (controls?.target) {
      controls.target.set(rx, ry, rz);
      controls.update();
    }
  }, [bounds, camera, controls]);

  return null;
}

function SplatScene({ src }: { src: string }) {
  const bounds = useSplatBounds(src);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={50} />
      {/* Damped orbit: drag to rotate, scroll to zoom, right-drag to pan. */}
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
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Suspense fallback={null}>
        <Splat src={src} alphaTest={0.1} position={[0, 0, 0]} />
      </Suspense>
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
  onClose,
  title = "3D Viewer"
}: GaussianSplatViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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

      {/* Canvas */}
      <div className="w-full h-full min-h-[400px]">
        {isLoading && <LoadingOverlay />}
        <Canvas
          gl={{ antialias: true, alpha: true }}
          onCreated={() => {
            // Give a small delay for the splat to load
            setTimeout(() => setIsLoading(false), 1500);
          }}
          className="w-full h-full"
        >
          <SplatScene src={src} />
        </Canvas>
      </div>

      {/* Controls overlay */}
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
