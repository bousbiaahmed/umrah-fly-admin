import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Plus, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/admin/Feedback";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_admin/rituals")({
  component: RitualsPage,
});

type Planning = { id_planning: number; type_evenement?: string; date?: string };
type Ritual = {
  id_rituel: number;
  nom: string;
  ordre: number;
  description?: string;
  id_douaa?: number | null;
  id_planning?: number;
  etapes?: unknown;
};

function trunc(s: string | undefined, n = 60) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function RitualsPage() {
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [selected, setSelected] = useState<Planning | null>(null);
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingR, setLoadingR] = useState(false);
  const [viewing, setViewing] = useState<Ritual | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Planning[]>("/planning/");
        const list = Array.isArray(data) ? data : [];
        setPlannings(list);
        if (list.length) setSelected(list[0]);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to load plannings");
      } finally {
        setLoadingP(false);
      }
    })();
  }, []);

  const loadRituals = async (id: number) => {
    setLoadingR(true);
    try {
      const data = await api<Ritual[]>(`/rituels/${id}`);
      setRituals(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load rituals");
      setRituals([]);
    } finally {
      setLoadingR(false);
    }
  };

  useEffect(() => {
    if (selected) loadRituals(selected.id_planning);
  }, [selected]);

  const columns: Column<Ritual>[] = [
    { key: "ordre", header: "Order", sortable: true, accessor: (r) => r.ordre },
    { key: "nom", header: "Name", sortable: true, accessor: (r) => r.nom },
    { key: "desc", header: "Description", render: (r) => trunc(r.description, 60) },
    { key: "dua", header: "Dua ID", accessor: (r) => r.id_douaa ?? "—" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <Button size="icon" variant="ghost" onClick={() => setViewing(r)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Left panel */}
      <div className="rounded-xl border bg-card p-3">
        <h3 className="px-2 py-1 text-sm font-semibold text-foreground">Plannings</h3>
        {loadingP ? (
          <Spinner />
        ) : plannings.length === 0 ? (
          <EmptyState message="No plannings." />
        ) : (
          <ul className="space-y-1 mt-2">
            {plannings.map((p) => (
              <li key={p.id_planning}>
                <button
                  onClick={() => setSelected(p)}
                  className={cn(
                    "w-full flex items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    selected?.id_planning === p.id_planning
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <Calendar className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {p.type_evenement || `Planning #${p.id_planning}`}
                    </div>
                    {p.date && (
                      <div
                        className={cn(
                          "text-xs",
                          selected?.id_planning === p.id_planning
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {new Date(p.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right panel */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">
              {selected
                ? `Rituals — ${selected.type_evenement || `#${selected.id_planning}`}`
                : "Select a planning"}
            </h3>
            <p className="text-sm text-muted-foreground">{rituals.length} rituals</p>
          </div>
          {selected && (
            <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Ritual
            </Button>
          )}
        </div>

        {!selected ? (
          <EmptyState message="Pick a planning on the left to see its rituals." />
        ) : loadingR ? (
          <Spinner />
        ) : (
          <DataTable
            rows={rituals}
            columns={columns}
            rowKey={(r) => r.id_rituel}
            emptyMessage="No rituals for this planning."
          />
        )}
      </div>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{viewing?.nom}</SheetTitle>
            <SheetDescription>Ritual #{viewing?.id_rituel}</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="mt-6 px-4 space-y-3 text-sm">
              <Field label="Order" value={String(viewing.ordre)} />
              <Field label="Description" value={viewing.description ?? "—"} />
              <Field label="Dua ID" value={String(viewing.id_douaa ?? "—")} />
              {viewing.etapes != null && (
                <div>
                  <div className="text-xs text-muted-foreground">Steps</div>
                  <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">
                    {JSON.stringify(viewing.etapes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {adding && selected && (
        <AddRitualDialog
          planningId={selected.id_planning}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            loadRituals(selected.id_planning);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-foreground break-words">{value}</div>
    </div>
  );
}

function AddRitualDialog({
  planningId,
  onClose,
  onAdded,
}: {
  planningId: number;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    nom: "",
    ordre: 1,
    description: "",
    id_douaa: 0,
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!form.nom) e2.nom = "Required";
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setSaving(true);
    try {
      await api("/rituels/", {
        method: "POST",
        body: { ...form, id_planning: planningId },
      });
      toast.success("Ritual created");
      onAdded();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add ritual</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className={`mt-1.5 ${errs.nom ? "border-destructive" : ""}`}
            />
            {errs.nom && <p className="text-xs text-destructive mt-1">{errs.nom}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Order</Label>
              <Input
                type="number"
                value={form.ordre}
                onChange={(e) => setForm({ ...form, ordre: Number(e.target.value) })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Dua ID</Label>
              <Input
                type="number"
                value={form.id_douaa}
                onChange={(e) => setForm({ ...form, id_douaa: Number(e.target.value) })}
                className="mt-1.5"
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div className="text-xs text-muted-foreground">Planning ID: {planningId}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
