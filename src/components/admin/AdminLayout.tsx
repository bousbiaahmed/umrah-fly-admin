import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  BookOpenText,
  Sparkles,
  ListChecks,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/users", label: "Utilisateurs", icon: Users },
  { to: "/duas", label: "Douaa", icon: BookOpenText },
  { to: "/rituals", label: "Rituels", icon: ListChecks },
  { to: "/dhikr", label: "Dhikr", icon: Sparkles },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar text-sidebar-foreground transition-transform md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gold flex items-center justify-center text-gold-foreground font-bold">
              U
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Umrah Fly</div>
              <div className="text-[11px] text-sidebar-foreground/60">Espace Admin</div>
            </div>
          </div>
          <button
            className="md:hidden text-sidebar-foreground/80 hover:text-sidebar-foreground"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1">
          {items.map((item) => {
            const active = location.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-gold"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card px-4 md:px-6">
          <button
            className="md:hidden text-foreground"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">
            {items.find((i) => location.pathname.startsWith(i.to))?.label ?? "Admin"}
          </h1>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
