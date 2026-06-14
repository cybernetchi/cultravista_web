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
  Image,
  Scale,
  Tag,
  Languages
} from "lucide-react";
// (MoreHorizontal removed with the fake stats/actions cleanup)
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
  const [lang, setLang] = useState<"en" | "zh">("en");

  // Whether Traditional Chinese content exists to offer a language toggle.
  const hasZh = Boolean(scan.titleZhHant || scan.descriptionZhHant);

  // Resolve displayed text by language, falling back to English.
  const displayTitle =
    lang === "zh" && scan.titleZhHant ? scan.titleZhHant : scan.title;
  const displayDescription =
    lang === "zh" && scan.descriptionZhHant
      ? scan.descriptionZhHant
      : scan.description;

  // Prefer the curator-supplied capture date; fall back to the created date.
  const dateToShow = scan.captureDate ? new Date(scan.captureDate) : scan.createdAt;
  const formattedDate = dateToShow.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dateLabel = scan.captureDate ? "Captured" : "Created";

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
              <h2 className="font-semibold text-foreground text-lg">{displayTitle}</h2>
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
            {/* Title + language toggle */}
            <div className="mb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-foreground">{displayTitle}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{scan.authorHandle}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {hasZh && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={() => setLang((l) => (l === "en" ? "zh" : "en"))}
                      title="Toggle language"
                    >
                      <Languages className="w-4 h-4" />
                      {lang === "en" ? "繁中" : "EN"}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Star className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-3 py-4 border-y border-border">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{dateLabel}</span>
                <span className="ml-auto text-foreground text-right">{formattedDate}</span>
              </div>
              {scan.locationText && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Location</span>
                  <span className="ml-auto text-foreground text-right truncate max-w-[160px]">{scan.locationText}</span>
                </div>
              )}
              {scan.rightsLicense && (
                <div className="flex items-center gap-3 text-sm">
                  <Scale className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Licence</span>
                  <span className="ml-auto text-foreground text-right truncate max-w-[160px]">{scan.rightsLicense}</span>
                </div>
              )}
              {scan.attribution && (
                <div className="flex items-center gap-3 text-sm">
                  <Pencil className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Attribution</span>
                  <span className="ml-auto text-foreground text-right truncate max-w-[160px]">{scan.attribution}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="py-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
              {displayDescription ? (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/60 italic">
                  No description yet. Use Edit to add one.
                </p>
              )}
            </div>

            {/* Tags */}
            {scan.tags && scan.tags.length > 0 && (
              <div className="pb-4">
                <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scan.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-md bg-secondary text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
