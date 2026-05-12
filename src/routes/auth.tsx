import { createFileRoute, redirect } from "@tanstack/react-router";
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
  beforeLoad: ({ search }) => {
    const { token, redirect: redirectTo } = search as {
      token?: string;
      redirect?: string;
    };

    if (token) {
      setToken(token);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        url.searchParams.delete("accessToken");
        url.searchParams.delete("access_token");
        url.searchParams.delete("redirect");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
      throw redirect({ to: (redirectTo as "/dashboard") || "/dashboard" });
    }

    throw redirect({ to: "/login" });
  },
  component: AuthCallback,
});

function AuthCallback() {
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
