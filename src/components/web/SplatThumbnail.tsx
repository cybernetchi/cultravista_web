import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Splat, PerspectiveCamera } from "@react-three/drei";

interface SplatThumbnailProps {
  splatUrl: string;
  fallbackImage?: string;
  className?: string;
}

// Cache for captured thumbnails
const thumbnailCache = new Map<string, string>();

// Queue system to prevent too many WebGL contexts
const captureQueue: Array<() => void> = [];
let isProcessingQueue = false;

function processQueue() {
  if (isProcessingQueue || captureQueue.length === 0) return;
  isProcessingQueue = true;
  const next = captureQueue.shift();
  if (next) {
    next();
  }
}

function finishCapture() {
  isProcessingQueue = false;
  // Small delay before processing next to let WebGL context be released
  setTimeout(processQueue, 100);
}

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
        finishCapture();
      }
    }, 2000); // Give more time for splat to load

    return () => {
      clearTimeout(timer);
      if (!capturedRef.current) {
        finishCapture();
      }
    };
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
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasRequestedCapture, setHasRequestedCapture] = useState(false);

  const handleCapture = useCallback((dataUrl: string) => {
    setCachedThumbnail(dataUrl);
    setIsCapturing(false);
  }, []);

  // Queue capture request on mount if not already cached
  useEffect(() => {
    if (!cachedThumbnail && !hasRequestedCapture) {
      setHasRequestedCapture(true);
      captureQueue.push(() => {
        setIsCapturing(true);
      });
      processQueue();
    }
  }, [cachedThumbnail, hasRequestedCapture]);

  // Show canvas when: hovering OR actively capturing
  const showCanvas = isHovered || isCapturing;

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Static thumbnail - show captured thumbnail */}
      {cachedThumbnail && (
        <img
          src={cachedThumbnail}
          alt="Scan thumbnail"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />
      )}
      
      {/* Loading state - show when waiting to capture or during capture */}
      {!cachedThumbnail && !showCanvas && (
        <div className="absolute inset-0 w-full h-full bg-secondary animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* 3D scene - render on hover OR when capturing thumbnail */}
      {showCanvas && (
        <Canvas
          className={`!absolute inset-0 ${isCapturing && !isHovered ? "opacity-0 pointer-events-none" : ""}`}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        >
          <SplatPreview 
            splatUrl={splatUrl} 
            onCapture={isCapturing ? handleCapture : undefined}
          />
        </Canvas>
      )}
    </div>
  );
}
