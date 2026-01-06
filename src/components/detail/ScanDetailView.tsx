import { ChevronLeft, Share2, Pencil, MessageSquare, MoreVertical, Calendar, MapPin, Box, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scan } from "@/types/scan";
import { IframeViewer } from "@/components/web/IframeViewer";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ScanDetailViewProps {
  scan: Scan;
  onBack: () => void;
  onEdit: () => void;
  onAnnotate: () => void;
}

export function ScanDetailView({ scan, onBack, onEdit, onAnnotate }: ScanDetailViewProps) {
  const [viewMode, setViewMode] = useState<"image" | "3d">(scan.splatUrl ? "3d" : "image");
  
  // Debug logging
  console.log('ScanDetailView scan data:', scan);
  console.log('splatUrl:', scan.splatUrl);
  console.log('viewMode:', viewMode);
  
  const formattedDate = scan.createdAt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = scan.createdAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      {/* Image viewer */}
      <div className="relative flex-1 min-h-[50vh]">
        {/* View mode toggle */}
        {scan.splatUrl && (
          <div className="absolute top-16 left-4 z-30 flex items-center bg-background/80 backdrop-blur-sm rounded-lg p-1">
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

        {viewMode === "3d" && scan.splatUrl ? (
          <IframeViewer 
            src={scan.splatUrl} 
            title={scan.title}
            className="w-full h-full"
          />
        ) : (
          <>
            <img
              src={scan.thumbnail}
              alt={scan.title}
              className="w-full h-full object-cover"
            />
            
            {/* Top gradient */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/80 to-transparent" />
            
            {/* Bottom gradient */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
          </>
        )}
        
        {/* Top controls */}
        <div className="absolute top-2 left-0 right-0 flex items-center justify-between px-4 z-30">
          <Button variant="icon" size="icon" onClick={onBack}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="icon" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="icon" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="bg-background px-5 py-6 space-y-4 pb-28">
        {/* Title and author */}
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {scan.title}
          </h1>
          <p className="text-primary font-medium">{scan.authorHandle}</p>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate} · {formattedTime}</span>
          </div>
          {scan.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{scan.location}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="action"
            className="flex-1 h-14"
            onClick={onEdit}
          >
            <Pencil className="w-5 h-5 mr-2" />
            Edit
          </Button>
          <Button
            variant="action"
            className="flex-1 h-14"
            onClick={onAnnotate}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Annotate
          </Button>
        </div>
      </div>
    </div>
  );
}
