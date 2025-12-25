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
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebDetailPanelProps {
  scan: Scan;
  onClose: () => void;
  onEdit: () => void;
  onAnnotate: () => void;
}

export function WebDetailPanel({ scan, onClose, onEdit, onAnnotate }: WebDetailPanelProps) {
  const formattedDate = scan.createdAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={cn(
      "w-[480px] h-full border-l border-border",
      "bg-card/50 backdrop-blur-xl",
      "flex flex-col animate-slide-in-right"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Scan Details</h2>
        <Button variant="icon" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Image preview */}
      <div className="relative group">
        <img
          src={scan.thumbnail}
          alt={scan.title}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        
        {/* Fullscreen button */}
        <Button
          variant="glass"
          size="icon"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Title and actions */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{scan.title}</h1>
            <p className="text-muted-foreground mt-1">{scan.authorHandle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="icon" size="icon">
              <Star className="w-4 h-4" />
            </Button>
            <Button variant="icon" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-3 py-4 border-y border-border">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Created</span>
            <span className="ml-auto text-foreground">{formattedDate}</span>
          </div>
          {scan.location && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Location</span>
              <span className="ml-auto text-foreground">{scan.location}</span>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 py-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">2.4K</div>
            <div className="text-xs text-muted-foreground mt-1">Views</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">128</div>
            <div className="text-xs text-muted-foreground mt-1">Downloads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">42</div>
            <div className="text-xs text-muted-foreground mt-1">Stars</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="captureOutline" className="gap-2" onClick={onEdit}>
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button variant="captureOutline" className="gap-2" onClick={onAnnotate}>
            <Pencil className="w-4 h-4" />
            Annotate
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
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
  );
}
