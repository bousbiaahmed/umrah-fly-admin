import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TOKEN_KEY } from "@/lib/api";

export const Route = createFileRoute("/_admin")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem(TOKEN_KEY)) {
      throw redirect({ to: "/" });
    }
  },
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
