import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Splat, PerspectiveCamera } from "@react-three/drei";
import cubePlaceholder from "@/assets/cube-placeholder.png";

interface SplatThumbnailProps {
  splatUrl: string;
  fallbackImage?: string;
  className?: string;
}

// Cache for captured thumbnails
const thumbnailCache = new Map<string, string>();

function CaptureScene({ splatUrl, onCapture }: { splatUrl: string; onCapture: (dataUrl: string) => void }) {
  const { gl, scene, camera } = useThree();
  const capturedRef = useRef(false);

  useEffect(() => {
    // Wait for splat to load and render, then capture
    const timer = setTimeout(() => {
      if (!capturedRef.current) {
        capturedRef.current = true;
        gl.render(scene, camera);
        const dataUrl = gl.domElement.toDataURL("image/jpeg", 0.8);
        thumbnailCache.set(splatUrl, dataUrl);
        onCapture(dataUrl);
      }
    }, 1500); // Give time for splat to load

    return () => clearTimeout(timer);
  }, [gl, scene, camera, splatUrl, onCapture]);

  return null;
}

function SplatPreview({ splatUrl, onCapture }: { splatUrl: string; onCapture?: (dataUrl: string) => void }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.5, 3]} fov={45} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        enableRotate={false}
        autoRotate 
        autoRotateSpeed={0.5}
      />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <Suspense fallback={null}>
        <Splat src={splatUrl} scale={1} />
      </Suspense>
      {onCapture && <CaptureScene splatUrl={splatUrl} onCapture={onCapture} />}
    </>
  );
}

export function SplatThumbnail({ splatUrl, fallbackImage, className }: SplatThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSplat, setShowSplat] = useState(false);
  const [cachedThumbnail, setCachedThumbnail] = useState<string | null>(
    () => thumbnailCache.get(splatUrl) || null
  );
  const [shouldCapture, setShouldCapture] = useState(!cachedThumbnail);

  const handleCapture = (dataUrl: string) => {
    setCachedThumbnail(dataUrl);
    setShouldCapture(false);
  };

  // Handle hover transition timing
  useEffect(() => {
    if (isHovered) {
      // Wait 1 second showing gradient, then show splat
      const timer = setTimeout(() => {
        setShowSplat(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowSplat(false);
    }
  }, [isHovered]);

  // Use cached thumbnail, then fallback image, then cube placeholder
  const displayImage = cachedThumbnail || fallbackImage || cubePlaceholder;
  const showCanvas = showSplat || shouldCapture;

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Static image - always show with cube placeholder as final fallback */}
      <img
        src={displayImage}
        alt="Scan thumbnail"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          isHovered ? "opacity-0" : "opacity-100"
        }`}
      />
      
      {/* Green gradient loading state */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isHovered && !showSplat ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(135deg, hsl(110 100% 40%) 0%, hsl(140 100% 35%) 50%, hsl(110 100% 55%) 100%)",
          backgroundSize: "200% 200%",
          animation: isHovered && !showSplat ? "gradient-shift 1s ease infinite" : "none",
        }}
      />
      
      {/* 3D scene */}
      {showCanvas && (
        <Canvas
          className={`!absolute inset-0 transition-opacity duration-500 ${
            showSplat ? "opacity-100" : "opacity-0"
          } ${shouldCapture && !showSplat ? "!opacity-0" : ""}`}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        >
          <SplatPreview 
            splatUrl={splatUrl} 
            onCapture={shouldCapture ? handleCapture : undefined}
          />
        </Canvas>
      )}
    </div>
  );
}
