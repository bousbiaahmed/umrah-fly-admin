import { createFileRoute, redirect } from "@tanstack/react-router";
import { setToken, getToken } from "@/lib/api";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    token:
      typeof search.token === "string"
        ? search.token
        : typeof search.accessToken === "string"
        ? search.accessToken
        : undefined,
  }),
  beforeLoad: ({ search }) => {
    const token = (search as { token?: string }).token;
    if (token) {
      setToken(token);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        url.searchParams.delete("accessToken");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
      throw redirect({ to: "/dashboard" });
    }
    if (getToken()) {
      throw redirect({ to: "/dashboard" });
    }
    throw redirect({ to: "/login" });
  },
});
