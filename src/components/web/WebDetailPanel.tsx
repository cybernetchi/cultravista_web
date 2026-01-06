import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";
import { 
  X, 
  Calendar, 
  MapPin, 
  Share2, 
  Download, 
  Edit2, 
  Pencil,
  Star,
  MoreHorizontal,
  Box,
  Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IframeViewer } from "./IframeViewer";
import { useState } from "react";

interface WebDetailPanelProps {
  scan: Scan;
  onClose: () => void;
  onEdit: () => void;
  onAnnotate: () => void;
}

export function WebDetailPanel({ scan, onClose, onEdit, onAnnotate }: WebDetailPanelProps) {
  const [viewMode, setViewMode] = useState<"image" | "3d">(scan.splatUrl ? "3d" : "image");
  
  const formattedDate = scan.createdAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Floating Panel */}
      <div className={cn(
        "fixed inset-4 md:inset-8 lg:inset-12 z-50",
        "bg-card border border-border rounded-2xl shadow-2xl",
        "flex overflow-hidden animate-scale-in"
      )}>
        {/* Left side - Model Preview (major portion) */}
        <div className="flex-1 flex flex-col min-w-0 bg-secondary/30">
          {/* Preview Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-foreground text-lg">{scan.title}</h2>
              {scan.splatUrl && (
                <div className="flex items-center bg-secondary rounded-lg p-1">
                  <Button
                    variant={viewMode === "3d" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-3 gap-1.5"
                    onClick={() => setViewMode("3d")}
                  >
                    <Box className="w-3.5 h-3.5" />
                    3D
                  </Button>
                  <Button
                    variant={viewMode === "image" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 px-3 gap-1.5"
                    onClick={() => setViewMode("image")}
                  >
                    <Image className="w-3.5 h-3.5" />
                    Image
                  </Button>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 relative min-h-0">
            {viewMode === "3d" && scan.splatUrl ? (
              <IframeViewer 
                src={scan.splatUrl} 
                title={scan.title}
                className="absolute inset-0 rounded-none border-0"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <img
                  src={scan.thumbnail}
                  alt={scan.title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right side - Details Panel */}
        <div className="w-80 lg:w-96 flex flex-col border-l border-border bg-card">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-medium text-foreground">Details</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Title and author */}
            <div className="mb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-foreground truncate">{scan.title}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{scan.authorHandle}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3 py-4 border-y border-border">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">Created</span>
                <span className="ml-auto text-foreground text-right">{formattedDate}</span>
              </div>
              {scan.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Location</span>
                  <span className="ml-auto text-foreground text-right truncate max-w-[140px]">{scan.location}</span>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 py-5">
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <div className="text-xl font-bold text-foreground">2.4K</div>
                <div className="text-xs text-muted-foreground mt-1">Views</div>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <div className="text-xl font-bold text-foreground">128</div>
                <div className="text-xs text-muted-foreground mt-1">Downloads</div>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <div className="text-xl font-bold text-foreground">42</div>
                <div className="text-xs text-muted-foreground mt-1">Stars</div>
              </div>
            </div>

            {/* Description placeholder */}
            <div className="py-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A high-quality 3D scan captured with Gaussian Splatting technology. 
                This model features detailed textures and accurate geometry.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="captureOutline" className="gap-2" onClick={onEdit}>
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
              <Button variant="captureOutline" className="gap-2" onClick={onAnnotate}>
                <Pencil className="w-4 h-4" />
                Annotate
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="secondary" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
