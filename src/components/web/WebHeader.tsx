import { Search, Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface WebHeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function WebHeader({ title, searchQuery, onSearchChange }: WebHeaderProps) {
  const [isDark, setIsDark] = useState(true);

  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>

      {/* Search & Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search scans, collections..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "w-full h-10 pl-11 pr-4 rounded-xl",
              "bg-secondary border border-border",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
              "transition-all duration-300"
            )}
          />
        </div>

        {/* Notifications */}
        <Button variant="icon" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="icon"
          size="icon"
          onClick={() => setIsDark(!isDark)}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <span className="text-primary-foreground font-semibold text-sm">A</span>
        </div>
      </div>
    </header>
  );
}
