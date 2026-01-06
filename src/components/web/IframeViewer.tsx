import { useState } from "react";
import { cn } from "@/lib/utils";

interface IframeViewerProps {
  src: string;
  className?: string;
  title?: string;
}

export function IframeViewer({ src, className, title }: IframeViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  // Build iframe URL - try direct S3 access first
  const iframeUrl = (() => {
    // For testing: bypass proxy and try direct S3 access
    return `/splat/index.html?url=${encodeURIComponent(src)}`;
    
    // Original proxy version (commented out):
    // if (src.startsWith("http")) {
    //   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zlzzjcvgkbwuaaizzrjv.supabase.co";
    //   const proxyUrl = `${supabaseUrl}/functions/v1/proxy?url=${encodeURIComponent(src)}`;
    //   return `/splat/index.html?url=${encodeURIComponent(proxyUrl)}`;
    // }
    // return `/splat/index.html?url=${encodeURIComponent(src)}`;
  })();

  const handleIframeLoad = () => {
    setIsLoading(false);
    // Focus the iframe after it loads to enable keyboard controls
    const iframe = document.querySelector("iframe[data-viewer]") as HTMLIFrameElement;
    if (iframe) {
      iframe.focus();
    }
  };

  const handleContainerClick = () => {
    // Focus iframe when container is clicked to enable keyboard controls
    const iframe = document.querySelector("iframe[data-viewer]") as HTMLIFrameElement;
    if (iframe) {
      iframe.focus();
    }
  };

  return (
    <div
      className={cn(
        "relative w-full h-full bg-black rounded-lg overflow-hidden",
        className
      )}
      onClick={handleContainerClick}
    >
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            <p className="text-sm">Loading 3D viewer...</p>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      <div className="absolute top-3 right-3 z-20 text-white bg-black bg-opacity-70 p-2 rounded text-xs max-w-48 opacity-0 hover:opacity-100 transition-opacity">
        <div className="font-medium mb-1">Controls:</div>
        <div className="space-y-0.5 opacity-90">
          <div>• Click & drag to orbit</div>
          <div>• Wheel: Zoom in/out</div>
          <div>• WASD: Camera angle</div>
          <div>• Arrow keys: Move</div>
        </div>
      </div>

      <iframe
        data-viewer
        src={iframeUrl}
        className="w-full h-full border-none"
        style={{ border: "none" }}
        allow="accelerometer; gyroscope; magnetometer"
        title={title || "3D Gaussian Splat Viewer"}
        onLoad={handleIframeLoad}
        tabIndex={0}
      />
    </div>
  );
}