import { createFileRoute, redirect } from "@tanstack/react-router";
import { setToken, getToken } from "@/lib/api";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.token) {
      setToken(search.token);
    }
    if (!getToken()) {
      // No token; still go to dashboard (no login required per current setup)
    }
    throw redirect({ to: "/dashboard" });
  },
});
