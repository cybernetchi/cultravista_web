import { Canvas } from "@react-three/fiber";
import { Splat, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useState } from "react";
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

function SplatScene({ src }: { src: string }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={50} />
      {/* Damped orbit: drag to rotate, scroll to zoom, right-drag to pan.
          makeDefault so the controls own the camera; damping for a smoother feel. */}
      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        enableDamping
        dampingFactor={0.1}
        minDistance={0.5}
        maxDistance={50}
        target={[0, 0, 0]}
      />
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
