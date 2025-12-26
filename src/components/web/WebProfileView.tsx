import { cn } from "@/lib/utils";
import { Camera, Settings, ExternalLink, Grid, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

import cubeLight from "@/assets/scans/cube-light.png";

export function WebProfileView() {
  const userScans = [
    { id: "1", thumbnail: cubeLight, title: "Al-Habis" },
    { id: "2", thumbnail: cubeLight, title: "Baby Yoda" },
    { id: "3", thumbnail: cubeLight, title: "Droughdool Mote" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Cover */}
      <div className="h-48 bg-gradient-to-br from-primary/20 via-background to-primary/5 relative">
        <Button variant="glass" size="sm" className="absolute top-4 right-4 gap-2">
          <Camera className="w-4 h-4" />
          Edit Cover
        </Button>
      </div>

      {/* Profile header */}
      <div className="max-w-4xl mx-auto px-8 -mt-16 relative z-10">
        <div className="flex items-end gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center border-4 border-background shadow-xl">
            <span className="text-primary-foreground font-bold text-4xl">A</span>
          </div>

          {/* Info */}
          <div className="flex-1 pb-2">
            <h1 className="text-2xl font-bold text-foreground">Alex Designer</h1>
            <p className="text-muted-foreground">@alexdesigner</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <Button variant="captureOutline">Edit Profile</Button>
            <Button variant="icon" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Bio */}
        <p className="mt-6 text-muted-foreground max-w-2xl">
          Digital heritage preservationist and 3D scanning enthusiast. Capturing the world's cultural artifacts one scan at a time.
        </p>

        {/* Stats */}
        <div className="flex gap-8 mt-6 py-6 border-y border-border">
          <div>
            <div className="text-2xl font-bold text-foreground">247</div>
            <div className="text-sm text-muted-foreground">Scans</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">12.4K</div>
            <div className="text-sm text-muted-foreground">Total Views</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">892</div>
            <div className="text-sm text-muted-foreground">Stars</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">156</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">2.1K</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mt-6">
          <button className="flex items-center gap-2 pb-3 border-b-2 border-primary text-primary font-medium">
            <Grid className="w-4 h-4" />
            My Scans
          </button>
          <button className="flex items-center gap-2 pb-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors">
            <Star className="w-4 h-4" />
            Starred
          </button>
          <button className="flex items-center gap-2 pb-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors">
            <Heart className="w-4 h-4" />
            Collections
          </button>
        </div>

        {/* Scans grid */}
        <div className="grid grid-cols-3 gap-4 mt-6 pb-8">
          {userScans.map((scan) => (
            <div
              key={scan.id}
              className="group aspect-square rounded-xl overflow-hidden bg-card cursor-pointer relative"
            >
              <img
                src={scan.thumbnail}
                alt={scan.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-foreground font-medium">{scan.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
