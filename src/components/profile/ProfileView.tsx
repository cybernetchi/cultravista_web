import { User, Camera, Settings, LogOut, ChevronRight, Star, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProfileView() {
  const stats = [
    { label: "Scans", value: 24 },
    { label: "Views", value: "1.2K" },
    { label: "Stars", value: 89 },
  ];

  const menuItems = [
    { icon: Grid3X3, label: "My Scans", badge: "24" },
    { icon: Star, label: "Favorites", badge: "12" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex-1 flex flex-col pb-24 animate-fade-in">
      {/* Header */}
      <header className="px-5 pt-2 pb-6">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
      </header>

      {/* Profile card */}
      <div className="px-5 mb-6">
        <div className="bg-card rounded-2xl p-6 flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-glow">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Name */}
          <h2 className="text-xl font-bold text-foreground mb-1">Creator</h2>
          <p className="text-primary font-medium mb-6">@creator</p>

          {/* Stats */}
          <div className="flex w-full justify-around">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="px-5 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl",
                "bg-card hover:bg-secondary transition-colors duration-300"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              {item.badge && (
                <span className="text-sm text-primary font-bold">{item.badge}</span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="px-5 mt-auto pt-6">
        <Button variant="outline" className="w-full h-12" >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
