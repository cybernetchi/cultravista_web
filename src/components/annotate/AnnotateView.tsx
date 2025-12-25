import { useState, useRef } from "react";
import { ChevronLeft, Undo2, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";

interface AnnotateViewProps {
  scan: Scan;
  onBack: () => void;
  onSave: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
}

const colors = [
  "hsl(110, 100%, 55%)", // Primary green
  "hsl(0, 0%, 100%)", // White
  "hsl(0, 72%, 51%)", // Red
  "hsl(47, 100%, 50%)", // Yellow
  "hsl(200, 100%, 50%)", // Blue
];

export function AnnotateView({ scan, onBack, onSave }: AnnotateViewProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
    setIsDrawing(true);
    setCurrentStroke([point]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const point = {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
    setCurrentStroke((prev) => [...prev, point]);
  };

  const handlePointerUp = () => {
    if (currentStroke.length > 0) {
      setStrokes((prev) => [...prev, { points: currentStroke, color: selectedColor }]);
    }
    setCurrentStroke([]);
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  const pathFromPoints = (points: Point[]) => {
    if (points.length < 2) return "";
    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${path} L ${point.x} ${point.y}`;
    }, "");
  };

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-sm">
        <Button variant="ghost" onClick={onBack} className="text-foreground">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Cancel
        </Button>
        <h2 className="text-lg font-semibold">Annotate</h2>
        <Button variant="ghost" onClick={onSave} className="text-primary font-semibold">
          <Check className="w-5 h-5 mr-1" />
          Save
        </Button>
      </div>

      {/* Tap to annotate hint */}
      <div className="px-4 py-2 bg-primary/10 border-y border-primary/20">
        <p className="text-center text-sm text-primary font-medium">
          Tap to annotate
        </p>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          ref={canvasRef}
          className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-card touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            src={scan.thumbnail}
            alt={scan.title}
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
          />

          {/* SVG overlay for drawings */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Completed strokes */}
            {strokes.map((stroke, i) => (
              <path
                key={i}
                d={pathFromPoints(stroke.points)}
                stroke={stroke.color}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {/* Current stroke */}
            {currentStroke.length > 0 && (
              <path
                d={pathFromPoints(currentStroke)}
                stroke={selectedColor}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card/50 backdrop-blur-xl border-t border-border px-5 py-6 pb-28">
        <div className="flex items-center justify-between">
          {/* Color picker */}
          <div className="flex gap-3">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all duration-300",
                  selectedColor === color 
                    ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" 
                    : "opacity-60 hover:opacity-100"
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Undo button */}
          <Button
            variant="icon"
            size="icon"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="disabled:opacity-30"
          >
            <Undo2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
