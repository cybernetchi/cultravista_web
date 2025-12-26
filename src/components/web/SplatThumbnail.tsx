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
        enableRotate={false}
        autoRotate 
        autoRotateSpeed={0.5}
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Static image - always rendered */}
      {fallbackImage && (
        <img
          src={fallbackImage}
          alt="Scan thumbnail"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
      
      {/* 3D scene - only rendered on hover */}
      {isHovered && (
        <Canvas
          className="!absolute inset-0"
          gl={{ antialias: true, alpha: true }}
        >
          <SplatPreview splatUrl={splatUrl} />
        </Canvas>
      )}
    </div>
  );
}
