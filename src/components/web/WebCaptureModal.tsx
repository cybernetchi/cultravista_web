import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { X, Camera, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CaptureState } from "@/types/scan";

interface WebCaptureModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export function WebCaptureModal({ onClose, onComplete }: WebCaptureModalProps) {
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (captureState === "capturing") {
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [captureState]);

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
      }, 60);
      return () => clearInterval(interval);
    }
  }, [captureState]);

  const handleStartCapture = () => {
    setCaptureState("capturing");
    setTimer(0);
  };

  const handleStopCapture = () => {
    setCaptureState("processing");
    setProgress(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex animate-fade-in">
      {/* Left panel */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">New Capture</h2>
          <Button variant="icon" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="p-6 space-y-4">
          <h3 className="font-medium text-foreground">Instructions</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              Position your camera towards the subject
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              Click "Start Capture" to begin recording
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              Move slowly around the object for best results
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              Click "Stop" when finished capturing
            </li>
          </ul>
        </div>

        <div className="flex-1" />

        {/* Status */}
        {captureState !== "idle" && (
          <div className="p-4 border-t border-border">
            <div className="text-center">
              {captureState === "capturing" && (
                <>
                  <div className="w-4 h-4 rounded-full bg-destructive animate-pulse mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">Recording</span>
                  <div className="text-2xl font-bold text-foreground mt-1">{formatTime(timer)}</div>
                </>
              )}
              {captureState === "processing" && (
                <>
                  <span className="text-sm text-muted-foreground">Processing scan...</span>
                  <Progress value={progress} className="mt-3" />
                  <span className="text-xs text-muted-foreground mt-2 block">{progress}%</span>
                </>
              )}
              {captureState === "complete" && (
                <>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm text-primary font-medium">Scan Complete!</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-t border-border">
          {captureState === "idle" && (
            <Button variant="capture" className="w-full gap-2" onClick={handleStartCapture}>
              <Camera className="w-5 h-5" />
              Start Capture
            </Button>
          )}
          {captureState === "capturing" && (
            <Button variant="destructive" className="w-full gap-2" onClick={handleStopCapture}>
              Stop Recording
            </Button>
          )}
          {captureState === "complete" && (
            <div className="space-y-3">
              <Button variant="capture" className="w-full gap-2" onClick={onComplete}>
                <Check className="w-4 h-4" />
                Save to Library
              </Button>
              <Button variant="ghost" className="w-full gap-2" onClick={() => {
                setCaptureState("idle");
                setTimer(0);
                setProgress(0);
              }}>
                <RotateCcw className="w-4 h-4" />
                Capture Again
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Center - Viewfinder */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background/50">
        <div className={cn(
          "relative w-full max-w-4xl aspect-video",
          "rounded-2xl overflow-hidden",
          "bg-card border-2 border-dashed",
          captureState === "capturing" ? "border-primary" : "border-border"
        )}>
          {/* Simulated viewfinder */}
          <div className="absolute inset-0 flex items-center justify-center">
            {captureState === "idle" && (
              <div className="text-center">
                <Camera className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                <p className="text-muted-foreground">Camera preview will appear here</p>
                <p className="text-sm text-muted-foreground/60 mt-2">Click "Start Capture" to begin</p>
              </div>
            )}
            {captureState === "capturing" && (
              <>
                {/* Corner brackets */}
                <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary" />
                <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary" />
                <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-primary" />
                <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-primary" />
                
                {/* Scanning line animation */}
                <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
                
                {/* Recording indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm text-foreground font-medium">REC</span>
                </div>
              </>
            )}
            {captureState === "processing" && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
                <p className="text-foreground font-medium">Processing your scan...</p>
                <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
              </div>
            )}
            {captureState === "complete" && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                  <Check className="w-10 h-10 text-primary" />
                </div>
                <p className="text-foreground font-medium text-lg">Capture Complete!</p>
                <p className="text-sm text-muted-foreground mt-2">Your 3D scan is ready</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
