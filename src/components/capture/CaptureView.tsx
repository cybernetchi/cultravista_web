import { useState, useEffect } from "react";
import { X, Zap, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CaptureState } from "@/types/scan";
import { cn } from "@/lib/utils";

interface CaptureViewProps {
  onClose: () => void;
  onComplete: () => void;
}

export function CaptureView({ onClose, onComplete }: CaptureViewProps) {
  const [captureState, setCaptureState] = useState<CaptureState>("pre");
  const [timer, setTimer] = useState(0);
  const [progress, setProgress] = useState(0);

  // Simulate capture timer
  useEffect(() => {
    if (captureState === "capturing") {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [captureState]);

  // Simulate processing progress
  useEffect(() => {
    if (captureState === "processing") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setCaptureState("complete");
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [captureState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:00`;
  };

  const handleCapture = () => {
    if (captureState === "pre") {
      setCaptureState("capturing");
    } else if (captureState === "capturing") {
      setCaptureState("processing");
    }
  };

  const renderContent = () => {
    switch (captureState) {
      case "pre":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
            {/* Camera viewfinder simulation */}
            <div className="relative w-full max-w-xs aspect-[3/4] rounded-3xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-8">
              {/* Scanning corners */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
              
              {/* Center crosshair */}
              <div className="w-12 h-12 border-2 border-primary/50 rounded-full" />
            </div>
            
            <p className="text-center text-muted-foreground max-w-xs">
              Point the camera at the subject then press to start scanning
            </p>
          </div>
        );

      case "capturing":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
            {/* Timer display */}
            <div className="text-5xl font-bold text-foreground font-mono mb-8">
              {formatTime(timer)}
            </div>
            
            {/* Animated scanning area */}
            <div className="relative w-full max-w-xs aspect-[3/4] rounded-3xl border-2 border-primary overflow-hidden mb-8">
              {/* Scanning line animation */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
              
              {/* Pulsing corners */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg animate-pulse" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg animate-pulse" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg animate-pulse" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg animate-pulse" />
            </div>
            
            <p className="text-center text-primary font-medium max-w-xs">
              Move around the subject, capturing it from all sides at high and low angles.
            </p>
          </div>
        );

      case "processing":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
            <div className="w-24 h-24 mb-8 relative">
              {/* Spinning loader */}
              <div className="absolute inset-0 border-4 border-secondary rounded-full" />
              <div 
                className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"
                style={{ animationDuration: "1s" }}
              />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Scan</h2>
            <p className="text-muted-foreground mb-8">Keep CultraVista open while processing</p>
            
            <div className="w-full max-w-xs space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">ALIGNING FRAMES</span>
                <span className="text-primary font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-scale-in">
            <div className="w-24 h-24 mb-8 rounded-full bg-primary/20 flex items-center justify-center glow-green">
              <Check className="w-12 h-12 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">Processing Complete</h2>
            <p className="text-muted-foreground text-center mb-8">
              Congratulations!<br />
              Your splat has finished processing!
            </p>
            
            <Button 
              variant="default" 
              size="xl"
              onClick={onComplete}
              className="w-full max-w-xs"
            >
              View Scan
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <Button variant="icon" size="icon" onClick={onClose}>
          <X className="w-6 h-6" />
        </Button>
        {captureState === "capturing" && (
          <div className="flex items-center gap-2 text-primary">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-semibold">Recording</span>
          </div>
        )}
        <Button variant="icon" size="icon">
          <Zap className="w-5 h-5" />
        </Button>
      </div>

      {renderContent()}

      {/* Bottom controls */}
      {(captureState === "pre" || captureState === "capturing") && (
        <div className="pb-12 pt-6 px-8 flex items-center justify-center gap-8">
          {captureState === "capturing" && (
            <Button variant="icon" size="iconLg" onClick={() => setCaptureState("pre")}>
              <RotateCcw className="w-6 h-6" />
            </Button>
          )}
          
          {/* Capture button */}
          <button
            onClick={handleCapture}
            className={cn(
              "relative w-20 h-20 rounded-full",
              "flex items-center justify-center",
              "transition-all duration-300",
              captureState === "capturing" && "animate-pulse-glow"
            )}
          >
            {/* Outer ring */}
            <div className={cn(
              "absolute inset-0 rounded-full border-4 transition-colors duration-300",
              captureState === "capturing" ? "border-primary" : "border-foreground"
            )} />
            {/* Inner button */}
            <div className={cn(
              "w-16 h-16 rounded-full transition-all duration-300",
              captureState === "capturing" 
                ? "bg-primary scale-75" 
                : "bg-foreground hover:scale-95"
            )} />
          </button>
          
          {captureState === "capturing" && (
            <div className="w-12 h-12" /> // Spacer for balance
          )}
        </div>
      )}

      {captureState === "processing" && (
        <div className="pb-12 pt-6 px-8 flex justify-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
