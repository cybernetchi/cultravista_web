import { 
  Bell, 
  Moon, 
  Wifi, 
  HardDrive, 
  Shield, 
  HelpCircle, 
  Info,
  ChevronRight 
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function SettingsView() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  const toggleItems = [
    { 
      icon: Bell, 
      label: "Notifications", 
      description: "Push and email alerts",
      value: notifications, 
      onChange: setNotifications 
    },
    { 
      icon: Moon, 
      label: "Dark Mode", 
      description: "Use dark theme",
      value: darkMode, 
      onChange: setDarkMode 
    },
    { 
      icon: Wifi, 
      label: "Offline Mode", 
      description: "Download scans for offline",
      value: offlineMode, 
      onChange: setOfflineMode 
    },
  ];

  const menuItems = [
    { icon: HardDrive, label: "Storage", description: "2.4 GB used" },
    { icon: Shield, label: "Privacy", description: "Manage your data" },
    { icon: HelpCircle, label: "Help & Support", description: "Get assistance" },
    { icon: Info, label: "About", description: "Version 1.0.0" },
  ];

  return (
    <div className="flex-1 flex flex-col pb-24 animate-fade-in">
      {/* Header */}
      <header className="px-5 pt-2 pb-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </header>

      {/* Toggle settings */}
      <div className="px-5 mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Preferences
        </h2>
        <div className="bg-card rounded-2xl overflow-hidden">
          {toggleItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-4 p-4",
                  index !== toggleItems.length - 1 && "border-b border-border"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch 
                  checked={item.value} 
                  onCheckedChange={item.onChange}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Menu items */}
      <div className="px-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          General
        </h2>
        <div className="bg-card rounded-2xl overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={cn(
                  "w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors",
                  index !== menuItems.length - 1 && "border-b border-border"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Version */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-sm text-muted-foreground">CultraVista v1.0.0</p>
        <p className="text-xs text-muted-foreground/60 mt-1">© 2025 CultraVista</p>
      </div>
    </div>
  );
}
