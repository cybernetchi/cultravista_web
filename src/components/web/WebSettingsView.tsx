import { cn } from "@/lib/utils";
import { 
  Bell, 
  Moon, 
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
import { Switch } from "@/components/ui/switch";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { id: "profile", icon: User, label: "Profile Settings", type: "link" },
      { id: "subscription", icon: CreditCard, label: "Subscription", type: "link" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { id: "notifications", icon: Bell, label: "Notifications", type: "toggle", defaultValue: true },
      { id: "darkMode", icon: Moon, label: "Dark Mode", type: "toggle", defaultValue: true },
      { id: "offline", icon: Wifi, label: "Offline Mode", type: "toggle", defaultValue: false },
      { id: "language", icon: Globe, label: "Language", type: "link", value: "English" },
    ],
  },
  {
    title: "Storage & Data",
    items: [
      { id: "storage", icon: HardDrive, label: "Storage Management", type: "link", value: "2.4 GB used" },
      { id: "privacy", icon: Shield, label: "Privacy & Security", type: "link" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", icon: HelpCircle, label: "Help & Support", type: "link" },
      { id: "about", icon: Info, label: "About CultraVista", type: "link", value: "v1.0.0" },
    ],
  },
];

export function WebSettingsView() {
  return (
    <div className="flex-1 overflow-y-auto py-8">
      <div className="max-w-2xl mx-auto px-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Settings</h1>

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
                        <Switch defaultChecked={item.defaultValue} />
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
