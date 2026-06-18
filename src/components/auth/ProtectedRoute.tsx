// Gates routes behind an authenticated session. While the initial session is
// resolving we show a loading state (no flash of authed content); once resolved,
// signed-out users are redirected to /auth.
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    // Preserve where the user was headed so we can return them after sign-in.
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
