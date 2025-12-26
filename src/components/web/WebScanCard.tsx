import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, MoreVertical, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SplatThumbnail } from "./SplatThumbnail";

interface WebScanCardProps {
  scan: Scan;
  onClick: () => void;
  viewMode: "grid" | "list";
  index: number;
}

export function WebScanCard({ scan, onClick, viewMode, index }: WebScanCardProps) {
  const formattedDate = scan.createdAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const renderThumbnail = (className: string) => {
    if (scan.splatUrl) {
      return (
        <SplatThumbnail
          splatUrl={scan.splatUrl}
          fallbackImage={scan.thumbnail}
          className={className}
        />
      );
    }
    return (
      <img
        src={scan.thumbnail}
        alt={scan.title}
        className={`${className} object-cover`}
      />
    );
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "group flex items-center gap-4 p-4 rounded-xl",
          "bg-card border border-border/50",
          "cursor-pointer transition-all duration-300",
          "hover:border-primary/30 hover:bg-card/80",
          "animate-fade-in"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
          {renderThumbnail("w-full h-full")}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {scan.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{scan.authorHandle}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </span>
            {scan.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {scan.location}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Star className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl overflow-hidden",
        "bg-card border border-border/50",
        "cursor-pointer transition-all duration-300",
        "hover:border-primary/30 hover:scale-[1.02]",
        "hover:shadow-[0_0_30px_hsl(110_100%_55%/0.15)]",
        "animate-fade-in"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image/Splat */}
      <div className="aspect-[4/3] overflow-hidden relative">
        {renderThumbnail("w-full h-full")}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {scan.title}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground">{scan.authorHandle}</p>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <Star className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
