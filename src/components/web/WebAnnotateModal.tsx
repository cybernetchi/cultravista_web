import { useState, useEffect, useRef, useCallback } from "react";
import { Scan, Annotation } from "@/types/scan";
import { X, Plus, Trash2, Check, ArrowUp, ArrowDown, Camera, Loader2, MapPin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GaussianSplatViewer } from "./GaussianSplatViewer";
import { AnnotationService } from "@/services/annotationService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WebAnnotateModalProps {
  scan: Scan;
  onClose: () => void;
  onSave: () => void;
}

// Working copy of an annotation; new ones carry a temp id until saved.
type Draft = Annotation;
const isTemp = (id: string) => id.startsWith("temp-");

// Spatial hotspot editor: place markers on the 3D model, narrate them
// bilingually, order them for a tour, and persist to Supabase.
export function WebAnnotateModal({ scan, onClose, onSave }: WebAnnotateModalProps) {
  const [items, setItems] = useState<Draft[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Getter (from the viewer) for the current camera pose.
  const getCameraPose = useRef<(() => Annotation["cameraPose"]) | null>(null);

  // Load existing hotspots.
  useEffect(() => {
    let active = true;
    (async () => {
      const res = await AnnotationService.getAnnotations(scan.id);
      if (!active) return;
      if (res.success && res.data) setItems(res.data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [scan.id]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const patchSelected = (patch: Partial<Draft>) => {
    if (!selectedId) return;
    setItems((prev) => prev.map((i) => (i.id === selectedId ? { ...i, ...patch } : i)));
  };

  // Drop a new hotspot where the user clicked the model.
  const handlePlace = useCallback((p: [number, number, number]) => {
    const id = `temp-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id,
        position: p,
        cameraPose: null,
        title: "",
        titleZhHant: "",
        body: "",
        bodyZhHant: "",
        orderIndex: prev.length,
      },
    ]);
    setSelectedId(id);
  }, []);

  const handleDelete = (id: string) => {
    if (!isTemp(id)) setDeletedIds((d) => [...d, id]);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const move = (id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  };

  const setCameraView = () => {
    if (!selectedId || !getCameraPose.current) return;
    patchSelected({ cameraPose: getCameraPose.current() });
    toast.success("Camera view saved for this hotspot");
  };

  const updateAxis = (axis: 0 | 1 | 2, value: string) => {
    if (!selected) return;
    const pos = [...selected.position] as [number, number, number];
    pos[axis] = Number(value);
    patchSelected({ position: pos });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Delete removed hotspots.
      for (const id of deletedIds) {
        await AnnotationService.deleteAnnotation(id);
      }
      // Create or update each item with its current order.
      for (let index = 0; index < items.length; index++) {
        const it = items[index];
        const input = {
          position: it.position,
          cameraPose: it.cameraPose,
          title: it.title,
          titleZhHant: it.titleZhHant,
          body: it.body,
          bodyZhHant: it.bodyZhHant,
          orderIndex: index,
        };
        const res = isTemp(it.id)
          ? await AnnotationService.createAnnotation(scan.id, input)
          : await AnnotationService.updateAnnotation(it.id, input);
        if (!res.success) throw new Error(res.error);
      }
      queryClient.invalidateQueries({ queryKey: ["annotations", scan.id] });
      toast.success("Hotspots saved");
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save hotspots");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex animate-fade-in">
      {/* Left panel */}
      <div className="w-[24rem] max-w-full border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Spatial Hotspots</h2>
          <Button variant="icon" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Hotspot list */}
        <div className="p-3 border-b border-border">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-2">
              No hotspots yet. Click the model to place one.
            </p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {items.map((it, i) => (
                <div
                  key={it.id}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer",
                    selectedId === it.id ? "bg-primary/15 text-primary" : "hover:bg-secondary"
                  )}
                  onClick={() => setSelectedId(it.id)}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/80 text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate text-sm">
                    {it.title || `Hotspot ${i + 1}`}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); move(it.id, -1); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0}>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); move(it.id, 1); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === items.length - 1}>
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(it.id); }} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected hotspot editor */}
        <div className="flex-1 overflow-y-auto p-4">
          {selected ? (
            <div className="space-y-4">
              <Tabs defaultValue="en">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="zh">繁體中文</TabsTrigger>
                </TabsList>
                <TabsContent value="en" className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="t-en">Title</Label>
                    <Input id="t-en" value={selected.title ?? ""} onChange={(e) => patchSelected({ title: e.target.value })} placeholder="Hotspot title" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="b-en">Body</Label>
                    <Textarea id="b-en" rows={4} value={selected.body ?? ""} onChange={(e) => patchSelected({ body: e.target.value })} placeholder="Narration / description" />
                  </div>
                </TabsContent>
                <TabsContent value="zh" className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="t-zh">標題</Label>
                    <Input id="t-zh" value={selected.titleZhHant ?? ""} onChange={(e) => patchSelected({ titleZhHant: e.target.value })} placeholder="熱點標題" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="b-zh">內容</Label>
                    <Textarea id="b-zh" rows={4} value={selected.bodyZhHant ?? ""} onChange={(e) => patchSelected({ bodyZhHant: e.target.value })} placeholder="旁白／描述" />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Position nudge */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Position</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["X", "Y", "Z"] as const).map((axis, idx) => (
                    <Input
                      key={axis}
                      type="number"
                      step="0.05"
                      aria-label={axis}
                      value={selected.position[idx]}
                      onChange={(e) => updateAxis(idx as 0 | 1 | 2, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Camera pose */}
              <Button variant="outline" className="w-full gap-2" onClick={setCameraView}>
                <Camera className="w-4 h-4" />
                {selected.cameraPose ? "Update camera view" : "Set camera view"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a hotspot to edit, or click the model to add one.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border space-y-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button variant="capture" className="w-full gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Hotspots
          </Button>
        </div>
      </div>

      {/* Center - 3D editor */}
      <div className="flex-1 p-4 bg-background/50">
        {scan.splatUrl ? (
          <GaussianSplatViewer
            src={scan.splatUrl}
            title={scan.title}
            className="w-full h-full"
            mode="edit"
            annotations={items}
            selectedId={selectedId}
            onSelectAnnotation={setSelectedId}
            onPlacePoint={handlePlace}
            onCameraPoseRef={(getter) => { getCameraPose.current = getter; }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>This capture has no 3D model yet.</p>
              <p className="text-sm">Hotspots need a finished splat to place onto.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
