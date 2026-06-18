import { useState, useEffect } from "react";
import { Scan } from "@/types/scan";
import { X, Check, Loader2, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaptureService } from "@/services/captureService";
import { CollectionService, Collection } from "@/services/collectionService";
import { toast } from "sonner";

interface WebEditModalProps {
  scan: Scan;
  onClose: () => void;
  onSave: () => void;
}

// Metadata editor for a capture: bilingual title/description plus provenance,
// rights, tags, and collection membership. Persists to Supabase on save.
export function WebEditModal({ scan, onClose, onSave }: WebEditModalProps) {
  // Bilingual + archival fields, seeded from the selected scan.
  const [titleEn, setTitleEn] = useState(scan.title ?? "");
  const [titleZh, setTitleZh] = useState(scan.titleZhHant ?? "");
  const [descEn, setDescEn] = useState(scan.description ?? "");
  const [descZh, setDescZh] = useState(scan.descriptionZhHant ?? "");
  const [captureDate, setCaptureDate] = useState(scan.captureDate ?? "");
  const [locationText, setLocationText] = useState(scan.locationText ?? "");
  const [lat, setLat] = useState(scan.lat != null ? String(scan.lat) : "");
  const [lng, setLng] = useState(scan.lng != null ? String(scan.lng) : "");
  const [rightsLicense, setRightsLicense] = useState(scan.rightsLicense ?? "");
  const [attribution, setAttribution] = useState(scan.attribution ?? "");
  const [tagsInput, setTagsInput] = useState((scan.tags ?? []).join(", "));

  // Collections
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Load the org's collections and this capture's current membership.
  useEffect(() => {
    let active = true;
    (async () => {
      const [colRes, idsRes] = await Promise.all([
        CollectionService.getCollections(),
        CollectionService.getCaptureCollectionIds(scan.id),
      ]);
      if (!active) return;
      if (colRes.success && colRes.data) setCollections(colRes.data);
      if (idsRes.success && idsRes.data) setSelectedCollectionIds(idsRes.data);
    })();
    return () => {
      active = false;
    };
  }, [scan.id]);

  const toggleCollection = (id: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    setCreatingCollection(true);
    const result = await CollectionService.createCollection({ name });
    setCreatingCollection(false);
    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to create collection");
      return;
    }
    setCollections((prev) => [...prev, result.data!]);
    setSelectedCollectionIds((prev) => [...prev, result.data!.id]);
    setNewCollectionName("");
  };

  const handleSave = async () => {
    if (!titleEn.trim()) {
      setError("An English title is required.");
      return;
    }
    setSaving(true);
    setError(null);

    // Parse helpers: empty string -> null; tags -> string[].
    const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
    const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const updateResult = await CaptureService.updateCapture(scan.id, {
      title: titleEn.trim(),
      title_zh_hant: orNull(titleZh),
      description: orNull(descEn),
      description_zh_hant: orNull(descZh),
      capture_date: orNull(captureDate),
      location_text: orNull(locationText),
      lat: numOrNull(lat),
      lng: numOrNull(lng),
      rights_license: orNull(rightsLicense),
      attribution: orNull(attribution),
      tags,
    });

    if (!updateResult.success) {
      setSaving(false);
      setError(updateResult.error || "Failed to save changes.");
      return;
    }

    const linkResult = await CollectionService.setCaptureCollections(
      scan.id,
      selectedCollectionIds
    );

    setSaving(false);

    if (!linkResult.success) {
      setError(linkResult.error || "Saved metadata, but failed to update collections.");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["captures"] });
    toast.success("Metadata saved");
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex animate-fade-in">
      {/* Left panel - Metadata form */}
      <div className="w-[28rem] max-w-full border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Edit Metadata</h2>
          <Button variant="icon" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Bilingual title + description */}
          <Tabs defaultValue="en">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="en">English</TabsTrigger>
              <TabsTrigger value="zh">繁體中文</TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title-en">Title</Label>
                <Input
                  id="title-en"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="Title (English)"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc-en">Description</Label>
                <Textarea
                  id="desc-en"
                  value={descEn}
                  onChange={(e) => setDescEn(e.target.value)}
                  placeholder="Describe this artifact (English)"
                  rows={4}
                  disabled={saving}
                />
              </div>
            </TabsContent>

            <TabsContent value="zh" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title-zh">標題</Label>
                <Input
                  id="title-zh"
                  value={titleZh}
                  onChange={(e) => setTitleZh(e.target.value)}
                  placeholder="標題（繁體中文）"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc-zh">描述</Label>
                <Textarea
                  id="desc-zh"
                  value={descZh}
                  onChange={(e) => setDescZh(e.target.value)}
                  placeholder="描述此文物（繁體中文）"
                  rows={4}
                  disabled={saving}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Provenance */}
          <div className="space-y-2">
            <Label htmlFor="capture-date">Capture date</Label>
            <Input
              id="capture-date"
              type="date"
              value={captureDate}
              onChange={(e) => setCaptureDate(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. Sheung Wan, Hong Kong"
              disabled={saving}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="22.2855"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="114.1577"
                disabled={saving}
              />
            </div>
          </div>

          {/* Rights */}
          <div className="space-y-2">
            <Label htmlFor="rights">Rights / licence</Label>
            <Input
              id="rights"
              value={rightsLicense}
              onChange={(e) => setRightsLicense(e.target.value)}
              placeholder="e.g. CC BY-NC 4.0"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attribution">Attribution</Label>
            <Input
              id="attribution"
              value={attribution}
              onChange={(e) => setAttribution(e.target.value)}
              placeholder="e.g. Space and Place Ltd."
              disabled={saving}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="comma, separated, tags"
              disabled={saving}
            />
          </div>

          {/* Collections */}
          <div className="space-y-2">
            <Label>Collections</Label>
            {collections.length > 0 ? (
              <div className="space-y-2 rounded-lg border border-border p-3">
                {collections.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedCollectionIds.includes(c.id)}
                      onCheckedChange={() => toggleCollection(c.id)}
                      disabled={saving}
                    />
                    <span className="text-sm text-foreground">{c.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No collections yet.</p>
            )}

            {/* Inline create */}
            <div className="flex gap-2">
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="New collection name"
                disabled={saving || creatingCollection}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCollection();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={handleCreateCollection}
                disabled={saving || creatingCollection || !newCollectionName.trim()}
              >
                {creatingCollection ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border">
          <Button
            variant="capture"
            className="w-full gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Center - preview */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background/50">
        <div className="relative max-w-3xl w-full">
          <img
            src={scan.thumbnail}
            alt={scan.title}
            className="w-full rounded-2xl shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}
