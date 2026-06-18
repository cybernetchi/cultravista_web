import { cn } from "@/lib/utils";
import { 
  Bell, 
  Moon, 
  Sun,
  Wifi, 
  HardDrive, 
  Shield, 
  HelpCircle, 
  Info,
  ChevronRight,
  User,
  CreditCard,
  Globe
} from "lucide-react";
import { LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";

export function WebSettingsView() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const isDark = theme === "dark";

  const settingsGroups = [
    {
      title: "Account",
      items: [
        { id: "profile", icon: User, label: "Profile Settings", type: "link" as const },
        { id: "subscription", icon: CreditCard, label: "Subscription", type: "link" as const },
      ],
    },
    {
      title: "Preferences",
      items: [
        { id: "notifications", icon: Bell, label: "Notifications", type: "toggle" as const, defaultValue: true },
        { id: "darkMode", icon: isDark ? Moon : Sun, label: "Dark Mode", type: "toggle" as const, defaultValue: isDark },
        { id: "offline", icon: Wifi, label: "Offline Mode", type: "toggle" as const, defaultValue: false },
        { id: "language", icon: Globe, label: "Language", type: "link" as const, value: "English" },
      ],
    },
    {
      title: "Storage & Data",
      items: [
        { id: "storage", icon: HardDrive, label: "Storage Management", type: "link" as const, value: "2.4 GB used" },
        { id: "privacy", icon: Shield, label: "Privacy & Security", type: "link" as const },
      ],
    },
    {
      title: "Support",
      items: [
        { id: "help", icon: HelpCircle, label: "Help & Support", type: "link" as const },
        { id: "about", icon: Info, label: "About CultraVista", type: "link" as const, value: "v1.0.0" },
      ],
    },
  ];

  const handleToggle = (id: string, checked: boolean) => {
    if (id === "darkMode") {
      setTheme(checked ? "dark" : "light");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto py-8">
      <div className="max-w-2xl mx-auto px-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>

        {/* Signed-in account + sign out */}
        <div className="bg-card rounded-xl border border-border p-4 mb-8 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="text-foreground font-medium truncate">
              {user?.email ?? "—"}
            </p>
          </div>
          <Button variant="outline" className="gap-2 shrink-0" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        <div className="space-y-8">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                {group.title}
              </h2>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-4 px-4 py-4",
                        "hover:bg-secondary/50 transition-colors cursor-pointer",
                        index !== group.items.length - 1 && "border-b border-border"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="flex-1 text-foreground font-medium">{item.label}</span>
                      
                      {item.type === "toggle" && (
                        <Switch 
                          defaultChecked={item.defaultValue} 
                          onCheckedChange={(checked) => handleToggle(item.id, checked)}
                        />
                      )}
                      {item.type === "link" && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {item.value && <span className="text-sm">{item.value}</span>}
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-sm font-medium text-destructive uppercase tracking-wider mb-3">
            Danger Zone
          </h2>
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium text-sm hover:bg-destructive/90 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
