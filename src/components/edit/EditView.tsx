import { useState } from "react";
import { ChevronLeft, Crop, Sun, Contrast, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";

interface EditViewProps {
  scan: Scan;
  onBack: () => void;
  onSave: () => void;
}

type EditTool = "crop" | "exposure" | "contrast";

export function EditView({ scan, onBack, onSave }: EditViewProps) {
  const [activeTool, setActiveTool] = useState<EditTool>("exposure");
  const [exposure, setExposure] = useState([50]);
  const [contrast, setContrast] = useState([50]);

  const tools = [
    { id: "crop" as const, icon: Crop, label: "Crop" },
    { id: "exposure" as const, icon: Sun, label: "Exposure" },
    { id: "contrast" as const, icon: Contrast, label: "Contrast" },
  ];

  // Calculate filter based on adjustments
  const filterStyle = {
    filter: `brightness(${0.5 + exposure[0] / 100}) contrast(${0.5 + contrast[0] / 100})`,
  };

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <Button variant="ghost" onClick={onBack} className="text-foreground">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Cancel
        </Button>
        <h2 className="text-lg font-semibold">Edit</h2>
        <Button variant="ghost" onClick={onSave} className="text-primary font-semibold">
          <Check className="w-5 h-5 mr-1" />
          Save
        </Button>
      </div>

      {/* Image preview */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-card">
          <img
            src={scan.thumbnail}
            alt={scan.title}
            className="w-full h-full object-cover transition-all duration-300"
            style={filterStyle}
          />
          
          {/* Crop overlay when crop is active */}
          {activeTool === "crop" && (
            <div className="absolute inset-4 border-2 border-primary border-dashed rounded-lg">
              {/* Corner handles */}
              {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
                <div
                  key={pos}
                  className={cn(
                    "absolute w-4 h-4 bg-primary rounded-full",
                    pos === "top-left" && "-top-2 -left-2",
                    pos === "top-right" && "-top-2 -right-2",
                    pos === "bottom-left" && "-bottom-2 -left-2",
                    pos === "bottom-right" && "-bottom-2 -right-2"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls panel */}
      <div className="bg-card/50 backdrop-blur-xl border-t border-border px-5 py-6 pb-28">
        {/* Slider for active tool */}
        {(activeTool === "exposure" || activeTool === "contrast") && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground capitalize">
                {activeTool}
              </span>
              <span className="text-sm font-bold text-primary">
                {activeTool === "exposure" ? exposure[0] : contrast[0]}%
              </span>
            </div>
            <Slider
              value={activeTool === "exposure" ? exposure : contrast}
              onValueChange={activeTool === "exposure" ? setExposure : setContrast}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Tool buttons */}
        <div className="flex justify-center gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300",
                  isActive 
                    ? "bg-primary/20 text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
