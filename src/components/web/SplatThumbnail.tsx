import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Splat, PerspectiveCamera } from "@react-three/drei";

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
  const [cachedThumbnail, setCachedThumbnail] = useState<string | null>(
    () => thumbnailCache.get(splatUrl) || null
  );
  const [shouldCapture, setShouldCapture] = useState(!cachedThumbnail);

  const handleCapture = (dataUrl: string) => {
    setCachedThumbnail(dataUrl);
    setShouldCapture(false);
  };

  // If no cached thumbnail, we need to render once to capture
  const showCanvas = isHovered || shouldCapture;
  const displayImage = cachedThumbnail || fallbackImage;

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Static image - show cached thumbnail or fallback */}
      {displayImage && (
        <img
          src={displayImage}
          alt="Scan thumbnail"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
      
      {/* 3D scene - render on hover OR when capturing thumbnail */}
      {showCanvas && (
        <Canvas
          className={`!absolute inset-0 ${shouldCapture && !isHovered ? "opacity-0" : ""}`}
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
