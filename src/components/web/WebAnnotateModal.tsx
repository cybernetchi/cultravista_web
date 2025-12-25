import { useState, useRef } from "react";
import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";
import { X, Undo2, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface WebAnnotateModalProps {
  scan: Scan;
  onClose: () => void;
  onSave: () => void;
}

const colors = [
  { name: "Green", value: "hsl(110, 100%, 55%)" },
  { name: "White", value: "hsl(0, 0%, 100%)" },
  { name: "Red", value: "hsl(0, 72%, 51%)" },
  { name: "Blue", value: "hsl(220, 100%, 55%)" },
  { name: "Yellow", value: "hsl(50, 100%, 50%)" },
];

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export function WebAnnotateModal({ scan, onClose, onSave }: WebAnnotateModalProps) {
  const [selectedColor, setSelectedColor] = useState(colors[0].value);
  const [strokeWidth, setStrokeWidth] = useState([4]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const getMousePosition = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getMousePosition(e);
    setIsDrawing(true);
    setCurrentStroke({
      points: [pos],
      color: selectedColor,
      width: strokeWidth[0],
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentStroke) return;
    const pos = getMousePosition(e);
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, pos],
    });
  };

  const handleMouseUp = () => {
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes([...strokes, currentStroke]);
    }
    setCurrentStroke(null);
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setStrokes(strokes.slice(0, -1));
  };

  const pointsToPath = (points: Point[]) => {
    if (points.length < 2) return "";
    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      return `${path} L ${point.x} ${point.y}`;
    }, "");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex animate-fade-in">
      {/* Left panel - Tools */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Annotate</h2>
          <Button variant="icon" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Colors */}
        <div className="p-4 space-y-4">
          <span className="text-sm text-muted-foreground">Color</span>
          <div className="flex gap-3">
            {colors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.value)}
                className={cn(
                  "w-10 h-10 rounded-full transition-all duration-200",
                  selectedColor === color.value 
                    ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" 
                    : "hover:scale-105"
                )}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>
        </div>

        {/* Stroke width */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Stroke Width</span>
            <span className="text-sm text-foreground font-medium">{strokeWidth[0]}px</span>
          </div>
          <Slider
            value={strokeWidth}
            onValueChange={setStrokeWidth}
            min={1}
            max={20}
            step={1}
          />
          <div className="flex items-center justify-center py-4">
            <div 
              className="rounded-full" 
              style={{ 
                width: strokeWidth[0] * 2, 
                height: strokeWidth[0] * 2,
                backgroundColor: selectedColor 
              }} 
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-3">
          <Button 
            variant="ghost" 
            className="w-full gap-2"
            onClick={handleUndo}
            disabled={strokes.length === 0}
          >
            <Undo2 className="w-4 h-4" />
            Undo ({strokes.length})
          </Button>
          <Button variant="capture" className="w-full gap-2" onClick={onSave}>
            <Check className="w-4 h-4" />
            Save Annotations
          </Button>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background/50">
        <div className="relative max-w-4xl w-full">
          <img
            src={scan.thumbnail}
            alt={scan.title}
            className="w-full rounded-2xl shadow-2xl"
          />
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full cursor-crosshair rounded-2xl"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {strokes.map((stroke, i) => (
              <path
                key={i}
                d={pointsToPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {currentStroke && (
              <path
                d={pointsToPath(currentStroke.points)}
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
