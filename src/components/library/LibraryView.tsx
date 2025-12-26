import { useState } from "react";
import { Search, Grid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScanCard } from "./ScanCard";
import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";

import cubeLight from "@/assets/scans/cube-light.png";

const mockScans: Scan[] = [
  {
    id: "1",
    title: "Al-Habis - Petra, Jordan",
    author: "Global Digital",
    authorHandle: "@globaldigital",
    thumbnail: cubeLight,
    createdAt: new Date("2025-07-01"),
    location: "Petra, Jordan",
  },
  {
    id: "2",
    title: "Baby Yoda",
    author: "Tomaa",
    authorHandle: "@tomaa",
    thumbnail: cubeLight,
    createdAt: new Date("2025-06-28"),
  },
  {
    id: "3",
    title: "Droughdool Mote",
    author: "Global Digital",
    authorHandle: "@globaldigital",
    thumbnail: cubeLight,
    createdAt: new Date("2025-06-25"),
  },
  {
    id: "4",
    title: "Marble Head Sculpture",
    author: "Tomaa",
    authorHandle: "@tomaa",
    thumbnail: cubeLight,
    createdAt: new Date("2025-06-20"),
  },
  {
    id: "5",
    title: "San Francisco Vista",
    author: "Global Digital",
    authorHandle: "@globaldigital",
    thumbnail: cubeLight,
    createdAt: new Date("2025-06-15"),
  },
  {
    id: "6",
    title: "Ancient Artifact",
    author: "Tomaa",
    authorHandle: "@tomaa",
    thumbnail: cubeLight,
    createdAt: new Date("2025-06-10"),
  },
];

interface LibraryViewProps {
  onSelectScan: (scan: Scan) => void;
  onStartCapture: () => void;
}

export function LibraryView({ onSelectScan, onStartCapture }: LibraryViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredScans = mockScans.filter(scan =>
    scan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scan.authorHandle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col pb-24">
      {/* Header */}
      <header className="px-5 pt-2 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">
            Library
          </h1>
          <Button
            variant="icon"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search scans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-12 pl-12 pr-4 rounded-xl",
              "bg-secondary border-none",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              "transition-all duration-300"
            )}
          />
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 px-5 overflow-y-auto">
        <div className={cn(
          "grid gap-3",
          viewMode === "grid" ? "grid-cols-2" : "grid-cols-1"
        )}>
          {filteredScans.map((scan, index) => (
            <ScanCard
              key={scan.id}
              scan={scan}
              onClick={() => onSelectScan(scan)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Floating action button */}
      <button
        onClick={onStartCapture}
        className={cn(
          "fixed bottom-24 right-5",
          "w-14 h-14 rounded-full",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "shadow-glow hover:shadow-glow-lg",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          "animate-fade-in"
        )}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
