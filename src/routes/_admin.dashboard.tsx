import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, BookOpenText, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/admin/Feedback";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState<{ users: number; duas: number; plannings: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, d, p] = await Promise.all([
          api<unknown[]>("/utilisateurs/"),
          api<unknown[]>("/douaa/all"),
          api<unknown[]>("/planning/"),
        ]);
        if (cancelled) return;
        setStats({
          users: Array.isArray(u) ? u.length : 0,
          duas: Array.isArray(d) ? d.length : 0,
          plannings: Array.isArray(p) ? p.length : 0,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;

  const cards = [
    { label: "Total Users", value: stats?.users ?? 0, Icon: Users, color: "bg-primary" },
    { label: "Total Duas", value: stats?.duas ?? 0, Icon: BookOpenText, color: "bg-gold" },
    {
      label: "Total Plannings",
      value: stats?.plannings ?? 0,
      Icon: CalendarDays,
      color: "bg-primary",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Welcome back 👋</h2>
        <p className="text-sm text-muted-foreground">Here is what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border bg-card p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center text-primary-foreground`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
              <div className="text-2xl font-semibold text-foreground">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
