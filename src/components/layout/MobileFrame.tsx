import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileFrameProps {
  children: ReactNode;
  className?: string;
  showStatusBar?: boolean;
}

export function MobileFrame({ children, className, showStatusBar = true }: MobileFrameProps) {
  return (
    <div className={cn(
      "relative w-full min-h-screen bg-background flex flex-col",
      className
    )}>
      {showStatusBar && <StatusBar />}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

function StatusBar() {
  const time = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: false 
  });

  return (
    <div className="h-11 px-6 flex items-center justify-between text-foreground text-sm font-medium bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <span>{time}</span>
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          <div className="w-1 h-3 bg-foreground rounded-full" />
          <div className="w-1 h-3 bg-foreground rounded-full" />
          <div className="w-1 h-2.5 bg-foreground/60 rounded-full" />
          <div className="w-1 h-2 bg-foreground/40 rounded-full" />
        </div>
        <span className="text-xs ml-1">5G</span>
        <div className="ml-2 w-6 h-3 border border-foreground rounded-sm relative">
          <div className="absolute inset-0.5 right-1 bg-primary rounded-sm" />
          <div className="absolute -right-0.5 top-1 w-0.5 h-1 bg-foreground rounded-r" />
        </div>
      </div>
    </div>
  );
}
