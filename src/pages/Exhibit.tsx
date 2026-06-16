import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { CaptureService } from "@/services/captureService";
import { AnnotationService } from "@/services/annotationService";
import { ExhibitView } from "@/components/exhibit/ExhibitView";

// Public exhibit page (/exhibit/:slug). No auth — relies on the published-only
// RLS read. `embed` renders the chromeless variant for iframes.
export default function Exhibit({
  embed = false,
  slug: slugProp,
}: {
  embed?: boolean;
  slug?: string;
}) {
  const params = useParams<{ slug: string }>();
  const slug = slugProp ?? params.slug;

  const captureQuery = useQuery({
    queryKey: ["exhibit", slug],
    queryFn: async () => {
      const res = await CaptureService.getPublishedCaptureBySlug(slug!);
      if (!res.success || !res.data) throw new Error(res.error || "Not found");
      return res.data;
    },
    enabled: !!slug,
    retry: false,
  });

  const annotationsQuery = useQuery({
    queryKey: ["exhibit-annotations", captureQuery.data?.id],
    queryFn: async () => {
      const res = await AnnotationService.getAnnotations(captureQuery.data!.id);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!captureQuery.data?.id,
  });

  if (captureQuery.isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (captureQuery.isError || !captureQuery.data) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-2 bg-background text-center px-6">
        <h1 className="text-xl font-semibold text-foreground">Exhibit not found</h1>
        <p className="text-sm text-muted-foreground">
          This exhibit may be unpublished or the link is incorrect.
        </p>
      </div>
    );
  }

  return (
    <ExhibitView
      capture={captureQuery.data}
      annotations={annotationsQuery.data ?? []}
      embed={embed}
    />
  );
}
