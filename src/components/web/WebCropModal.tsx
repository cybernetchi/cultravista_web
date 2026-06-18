import { useState, useEffect, useMemo } from "react";
import { Scan } from "@/types/scan";
import { X, Check, Loader2, RotateCcw, Undo2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { GaussianSplatViewer, resolveSplatUrl } from "./GaussianSplatViewer";
import { cropAndClean, countKept, radialPercentiles } from "@/lib/splatEdit";
import { StorageService } from "@/services/storageService";
import { CaptureService } from "@/services/captureService";
import { toast } from "sonner";

interface WebCropModalProps {
  scan: Scan;
  onClose: () => void;
  onSave: () => void;
  /** Tells the layout the model URL changed so the detail view refreshes. */
  onModelReplaced?: (url: string) => void;
}

type Vec3 = [number, number, number];

// Crop / clean-up editor: size a box around the artifact with sliders + optional
// floater removal, then save a tightened .splat (non-destructive — original kept).
export function WebCropModal({ scan, onClose, onSave, onModelReplaced }: WebCropModalProps) {
  const queryClient = useQueryClient();

  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [box, setBox] = useState<{ min: Vec3; max: Vec3 } | null>(null);
  const [removeFloaters, setRemoveFloaters] = useState(false);
  const [floaterStrength, setFloaterStrength] = useState([0.3]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the current splat bytes (via the CORS proxy).
  useEffect(() => {
    if (!scan.splatUrl) {
      setLoadError("This capture has no 3D model to edit.");
      return;
    }
    let active = true;
    fetch(resolveSplatUrl(scan.splatUrl))
      .then((r) => r.arrayBuffer())
      .then((buf) => active && setBuffer(buf))
      .catch((e) => active && setLoadError(String(e)));
    return () => {
      active = false;
    };
  }, [scan.splatUrl]);

  // Median center + radial percentiles drive the slider ranges + defaults.
  const stats = useMemo(
    () => (buffer ? radialPercentiles(buffer, [0.5, 0.99]) : null),
    [buffer]
  );

  // Base the box on the DENSE OBJECT CORE (p50 × 1.8 — what the viewer frames
  // to), not the p99 background, so sliders are usable on whole-room captures.
  const coreRadius = stats ? (stats.values[0] || 1) * 1.8 : 1;

  // Default box = center ± core radius.
  const defaultBox = useMemo<{ min: Vec3; max: Vec3 } | null>(() => {
    if (!stats) return null;
    const [cx, cy, cz] = stats.center;
    const r = coreRadius;
    return { min: [cx - r, cy - r, cz - r], max: [cx + r, cy + r, cz + r] };
  }, [stats, coreRadius]);

  // Initialise the box once the defaults are known.
  useEffect(() => {
    if (defaultBox && !box) setBox(defaultBox);
  }, [defaultBox, box]);

  const maxRadial =
    removeFloaters && stats
      ? stats.values[1] + (stats.values[0] - stats.values[1]) * floaterStrength[0]
      : undefined;

  const counts = useMemo(() => {
    if (!buffer) return null;
    return countKept(buffer, { box: box ?? undefined, maxRadial });
  }, [buffer, box, maxRadial]);

  const handleApply = async () => {
    if (!buffer) {
      toast.error("Model still loading — try again in a moment.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data, kept } = cropAndClean(buffer, { box: box ?? undefined, maxRadial });
      if (kept === 0) throw new Error("That would remove every point — widen the box.");
      const blob = new Blob([data], { type: "application/octet-stream" });
      const up = await StorageService.uploadSplat(blob, scan.id);
      if (!up.success || !up.url) throw new Error(up.error || "Upload failed");
      const res = await CaptureService.updateCapture(scan.id, { file: up.url });
      if (!res.success) throw new Error(res.error);
      queryClient.invalidateQueries({ queryKey: ["captures"] });
      onModelReplaced?.(up.url);
      toast.success(`Saved cropped model (${kept.toLocaleString()} points)`);
      onSave();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
      toast.error(msg);
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    if (!scan.folderPath) {
      toast.error("No original on file to revert to.");
      return;
    }
    setSaving(true);
    setError(null);
    const url = `${scan.folderPath}/output.splat`;
    const res = await CaptureService.updateCapture(scan.id, { file: url });
    setSaving(false);
    if (!res.success) {
      setError(res.error || "Revert failed");
      toast.error(res.error || "Revert failed");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["captures"] });
    onModelReplaced?.(url);
    toast.success("Reverted to original");
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex animate-fade-in">
      {/* Left panel */}
      <div className="w-[23rem] max-w-full border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Crop & Clean Up</h2>
          <Button variant="icon" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Crop box sliders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Crop box</Label>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5" onClick={() => defaultBox && setBox(defaultBox)}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Drag the green handles on the box in the 3D view to tighten it around
              the artifact. Everything outside the box is removed.
            </p>
            {!box && <p className="text-xs text-muted-foreground">Loading…</p>}
          </div>

          {/* Floater removal */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label htmlFor="floaters">Remove floaters</Label>
              <Switch id="floaters" checked={removeFloaters} onCheckedChange={setRemoveFloaters} />
            </div>
            {removeFloaters && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Gentle</span>
                  <span>Aggressive</span>
                </div>
                <Slider value={floaterStrength} onValueChange={setFloaterStrength} min={0} max={1} step={0.05} />
              </div>
            )}
          </div>

          {/* Count */}
          <div className="rounded-lg bg-secondary/50 p-3 text-sm">
            {counts ? (
              <span className="text-foreground">
                Keeping <strong>{counts.kept.toLocaleString()}</strong> of{" "}
                {counts.total.toLocaleString()} points
                <span className="text-muted-foreground">
                  {" "}({((100 * counts.kept) / Math.max(1, counts.total)).toFixed(0)}%)
                </span>
              </span>
            ) : loadError ? (
              <span className="text-destructive">{loadError}</span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading model…
              </span>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="capture" className="w-full gap-2" onClick={handleApply} disabled={saving || !buffer}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Apply & Save
          </Button>
          <Button variant="ghost" className="w-full gap-2" onClick={handleRevert} disabled={saving}>
            <Undo2 className="w-4 h-4" /> Revert to original
          </Button>
        </div>
      </div>

      {/* Center - viewer with live crop box */}
      <div className="flex-1 p-4 bg-background/50">
        {scan.splatUrl ? (
          <GaussianSplatViewer
            src={scan.splatUrl}
            title={scan.title}
            className="w-full h-full"
            mode="crop"
            cropBox={box}
            onCropBoxChange={setBox}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No 3D model to edit.
          </div>
        )}
      </div>
    </div>
  );
}
