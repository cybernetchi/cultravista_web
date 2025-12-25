import { useState } from "react";
import { Grid, List, Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebScanCard } from "./WebScanCard";
import { Scan } from "@/types/scan";
import { cn } from "@/lib/utils";

import scan1 from "@/assets/scans/scan-1.jpg";
import scan2 from "@/assets/scans/scan-2.jpg";
import scan3 from "@/assets/scans/scan-3.jpg";
import scan4 from "@/assets/scans/scan-4.jpg";
import scan5 from "@/assets/scans/scan-5.jpg";
import scan6 from "@/assets/scans/scan-6.jpg";

const mockScans: Scan[] = [
  {
    id: "1",
    title: "Al-Habis - Petra, Jordan",
    author: "Global Digital",
    authorHandle: "@globaldigital",
    thumbnail: scan1,
    createdAt: new Date("2025-07-01"),
    location: "Petra, Jordan",
  },
  {
    id: "2",
    title: "Baby Yoda",
    author: "Tomaa",
    authorHandle: "@tomaa",
    thumbnail: scan2,
    createdAt: new Date("2025-06-28"),
  },
  {
    id: "3",
    title: "Droughdool Mote",
    author: "Global Digital",
    authorHandle: "@globaldigital",
    thumbnail: scan3,
    createdAt: new Date("2025-06-25"),
  },
  {
    id: "4",
    title: "Marble Head Sculpture",
    author: "Tomaa",
    authorHandle: "@tomaa",
    thumbnail: scan4,
    createdAt: new Date("2025-06-20"),
  },
  {
    id: "5",
    title: "San Francisco Vista",
    author: "Global Digital",
    authorHandle: "@globaldigital",
    thumbnail: scan5,
    createdAt: new Date("2025-06-15"),
  },
  {
    id: "6",
    title: "Ancient Artifact",
    author: "Tomaa",
    authorHandle: "@tomaa",
    thumbnail: scan6,
    createdAt: new Date("2025-06-10"),
  },
];

interface WebLibraryViewProps {
  onSelectScan: (scan: Scan) => void;
  searchQuery: string;
}

export function WebLibraryView({ onSelectScan, searchQuery }: WebLibraryViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredScans = mockScans.filter(scan =>
    scan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scan.authorHandle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            {filteredScans.length} scans
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <SortAsc className="w-4 h-4" />
            Sort
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="flex items-center bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid/List */}
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        <div className={cn(
          "grid gap-5",
          viewMode === "grid" 
            ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
            : "grid-cols-1"
        )}>
          {filteredScans.map((scan, index) => (
            <WebScanCard
              key={scan.id}
              scan={scan}
              onClick={() => onSelectScan(scan)}
              viewMode={viewMode}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
