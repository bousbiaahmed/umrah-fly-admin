import { createFileRoute, redirect } from "@tanstack/react-router";
import { setToken, getToken } from "@/lib/api";

export const Route = createFileRoute("/")({
  // Accept either `token` or `accessToken` query parameter (mobile clients vary)
  validateSearch: (search: Record<string, unknown>) => ({
    token:
      typeof search.token === "string"
        ? search.token
        : typeof search.accessToken === "string"
        ? search.accessToken
        : undefined,
  }),
  beforeLoad: ({ search }) => {
    const token = (search as any).token || (search as any).accessToken;
    if (token) {
      setToken(token);
    }
    if (!getToken()) {
      // No token; still go to dashboard (no login required per current setup)
    }
    throw redirect({ to: "/dashboard" });
  },
});
