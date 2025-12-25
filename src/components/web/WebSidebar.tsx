import { cn } from "@/lib/utils";
import { 
  Library, 
  Camera, 
  User, 
  Settings, 
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface WebSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onStartCapture: () => void;
}

const navItems = [
  { id: "library", label: "Library", icon: Library },
  { id: "capture", label: "Capture", icon: Camera },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
];

export function WebSidebar({ activeTab, onTabChange, onStartCapture }: WebSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar-background border-r border-sidebar-border",
        "flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-lg">C</span>
        </div>
        {!collapsed && (
          <span className="text-xl font-bold text-foreground tracking-tight animate-fade-in">
            CultraVista
          </span>
        )}
      </div>

      {/* New Capture Button */}
      <div className="px-4 mb-6">
        <Button
          variant="capture"
          className={cn(
            "w-full h-12 gap-2 font-semibold",
            collapsed && "px-0 justify-center"
          )}
          onClick={onStartCapture}
        >
          <Plus className="w-5 h-5" />
          {!collapsed && <span>New Capture</span>}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => item.id === "capture" ? onStartCapture() : onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl",
                    "transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "glow-green")} />
                  {!collapsed && (
                    <span className="font-medium animate-fade-in">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2 rounded-lg",
            "text-muted-foreground hover:text-foreground hover:bg-secondary",
            "transition-all duration-200",
            collapsed && "justify-center px-0"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
