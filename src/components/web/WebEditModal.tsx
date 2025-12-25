import { useState } from "react";
import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";
import { X, Crop, Sun, Contrast, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface WebEditModalProps {
  scan: Scan;
  onClose: () => void;
  onSave: () => void;
}

const editTools = [
  { id: "crop", icon: Crop, label: "Crop" },
  { id: "exposure", icon: Sun, label: "Exposure" },
  { id: "contrast", icon: Contrast, label: "Contrast" },
];

export function WebEditModal({ scan, onClose, onSave }: WebEditModalProps) {
  const [activeTool, setActiveTool] = useState("exposure");
  const [exposure, setExposure] = useState([0]);
  const [contrast, setContrast] = useState([0]);

  const getImageStyle = () => ({
    filter: `brightness(${1 + exposure[0] / 100}) contrast(${1 + contrast[0] / 100})`,
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex animate-fade-in">
      {/* Left panel - Tools */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Edit Scan</h2>
          <Button variant="icon" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tool tabs */}
        <div className="p-4 space-y-2">
          {editTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                  "transition-all duration-200",
                  activeTool === tool.id
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tool.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tool controls */}
        <div className="flex-1 p-4">
          {activeTool === "exposure" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Exposure</span>
                <span className="text-sm text-foreground font-medium">{exposure[0]}</span>
              </div>
              <Slider
                value={exposure}
                onValueChange={setExposure}
                min={-100}
                max={100}
                step={1}
              />
            </div>
          )}
          {activeTool === "contrast" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Contrast</span>
                <span className="text-sm text-foreground font-medium">{contrast[0]}</span>
              </div>
              <Slider
                value={contrast}
                onValueChange={setContrast}
                min={-100}
                max={100}
                step={1}
              />
            </div>
          )}
          {activeTool === "crop" && (
            <div className="text-center text-muted-foreground py-8">
              Drag on the image to crop
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-3">
          <Button 
            variant="ghost" 
            className="w-full gap-2"
            onClick={() => {
              setExposure([0]);
              setContrast([0]);
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </Button>
          <Button variant="capture" className="w-full gap-2" onClick={onSave}>
            <Check className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Center - Image preview */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background/50">
        <div className="relative max-w-4xl w-full">
          <img
            src={scan.thumbnail}
            alt={scan.title}
            className="w-full rounded-2xl shadow-2xl transition-all duration-300"
            style={getImageStyle()}
          />
        </div>
      </div>
    </div>
  );
}
