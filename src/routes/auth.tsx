import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setToken } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    token:
      typeof search.token === "string"
        ? search.token
        : typeof search.accessToken === "string"
        ? search.accessToken
        : typeof search.access_token === "string"
        ? search.access_token
        : undefined,
    redirect:
      typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  useEffect(() => {
    const token = search.token;
    const redirectTo = search.redirect || "/dashboard";

    if (!token) {
      navigate({ to: "/login", replace: true });
      return;
    }

    setToken(token);

    const url = new URL(window.location.href);
    url.searchParams.delete("token");
    url.searchParams.delete("accessToken");
    url.searchParams.delete("access_token");
    url.searchParams.delete("redirect");
    window.history.replaceState({}, document.title, url.pathname + url.search);

    navigate({ to: redirectTo as "/dashboard", replace: true });
  }, [navigate, search.redirect, search.token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">
          Connexion en cours...
        </p>
      </div>
    </div>
  );
}
