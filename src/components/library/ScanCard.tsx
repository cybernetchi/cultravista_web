import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";

interface ScanCardProps {
  scan: Scan;
  onClick: () => void;
  index: number;
}

export function ScanCard({ scan, onClick, index }: ScanCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative aspect-square rounded-2xl overflow-hidden bg-card",
        "transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]",
        "animate-fade-up"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <img
        src={scan.thumbnail}
        alt={scan.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-sm font-semibold text-foreground truncate">
          {scan.title}
        </h3>
        <p className="text-xs text-primary font-medium">
          {scan.authorHandle}
        </p>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 border-2 border-primary/30 rounded-2xl" />
      </div>
    </button>
  );
}
