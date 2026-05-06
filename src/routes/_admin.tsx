import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/_admin")({
  component: () => (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  ),
});
