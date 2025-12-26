import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Splat, PerspectiveCamera } from "@react-three/drei";

interface SplatThumbnailProps {
  splatUrl: string;
  fallbackImage?: string;
  className?: string;
}

function SplatPreview({ splatUrl }: { splatUrl: string }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.5, 3]} fov={45} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate 
        autoRotateSpeed={2}
      />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <Suspense fallback={null}>
        <Splat src={splatUrl} scale={1} />
      </Suspense>
    </>
  );
}

export function SplatThumbnail({ splatUrl, fallbackImage, className }: SplatThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (hasError && fallbackImage) {
    return (
      <img
        src={fallbackImage}
        alt="Scan thumbnail"
        className={className}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && fallbackImage && (
        <img
          src={fallbackImage}
          alt="Scan thumbnail"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <Canvas
        className="!absolute inset-0"
        gl={{ antialias: true, alpha: true }}
        onCreated={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      >
        <SplatPreview splatUrl={splatUrl} />
      </Canvas>
    </div>
  );
}
