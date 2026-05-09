import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Plus, Pencil, Trash2, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/admin/Feedback";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
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

export const Route = createFileRoute("/_admin/dhikr")({
  component: DhikrPage,
});

type Planning = { id_planning: number; type_evenement?: string; date?: string };
type Dhikr = {
  id_dhikr: number;
  nom: string;
  ordre: number;
  description?: string;
  repetitions: number;
  id_planning?: number;
};

function trunc(s: string | undefined, n = 60) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function DhikrPage() {
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [selected, setSelected] = useState<Planning | null>(null);
  const [dhikrs, setDhikrs] = useState<Dhikr[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingD, setLoadingD] = useState(false);
  const [viewing, setViewing] = useState<Dhikr | null>(null);
  const [editing, setEditing] = useState<Dhikr | null>(null);
  const [deleting, setDeleting] = useState<Dhikr | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Planning[]>("/planning/");
        const list = Array.isArray(data) ? data : [];
        setPlannings(list);
        if (list.length) setSelected(list[0]);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Échec du chargement des plannings");
      } finally {
        setLoadingP(false);
      }
    })();
  }, []);

  const loadDhikrs = async (id: number) => {
    setLoadingD(true);
    try {
      const data = await api<Dhikr[]>(`/dhikr/${id}`);
      setDhikrs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec du chargement des dhikr");
      setDhikrs([]);
    } finally {
      setLoadingD(false);
    }
  };

  useEffect(() => {
    if (selected) loadDhikrs(selected.id_planning);
  }, [selected]);

  const handleView = async (d: Dhikr) => {
    try {
      const detail = await api<Dhikr>(`/dhikr/detail/${d.id_dhikr}`);
      setViewing(detail);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec du chargement du détail");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/dhikr/${deleting.id_dhikr}`, { method: "DELETE" });
      toast.success("Dhikr supprimé");
      setDhikrs((prev) => prev.filter((d) => d.id_dhikr !== deleting.id_dhikr));
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la suppression");
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Dhikr>[] = [
    { key: "ordre", header: "Ordre", sortable: true, accessor: (d) => d.ordre },
    { key: "nom", header: "Nom", sortable: true, accessor: (d) => d.nom },
    { key: "desc", header: "Description", render: (d) => trunc(d.description, 60) },
    { key: "rep", header: "Répétitions", sortable: true, accessor: (d) => d.repetitions },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => handleView(d)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(d)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(d)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-xl border bg-card p-3">
        <h3 className="px-2 py-1 text-sm font-semibold">Plannings</h3>
        {loadingP ? (
          <Spinner />
        ) : plannings.length === 0 ? (
          <EmptyState message="Aucun planning." />
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

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">
              {selected
                ? `Dhikr — ${selected.type_evenement || `#${selected.id_planning}`}`
                : "Sélectionnez un planning"}
            </h3>
            <p className="text-sm text-muted-foreground">{dhikrs.length} dhikr</p>
          </div>
          {selected && (
            <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Dhikr
            </Button>
          )}
        </div>

        {!selected ? (
          <EmptyState message="Choisissez un planning pour voir ses dhikr." />
        ) : loadingD ? (
          <Spinner />
        ) : (
          <DataTable
            rows={dhikrs}
            columns={columns}
            rowKey={(d) => d.id_dhikr}
            emptyMessage="Aucun dhikr pour ce planning."
          />
        )}
      </div>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{viewing?.nom}</SheetTitle>
            <SheetDescription>Dhikr #{viewing?.id_dhikr}</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="mt-6 px-4 space-y-3 text-sm">
              <Field label="Ordre" value={String(viewing.ordre)} />
              <Field label="Répétitions" value={String(viewing.repetitions)} />
              <Field label="Description" value={viewing.description ?? "—"} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {adding && selected && (
        <DhikrFormDialog
          planningId={selected.id_planning}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            loadDhikrs(selected.id_planning);
          }}
        />
      )}

      {editing && (
        <DhikrFormDialog
          planningId={editing.id_planning ?? selected?.id_planning ?? 0}
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            if (selected) loadDhikrs(selected.id_planning);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer le dhikr ?"
        description={`Cela supprimera définitivement « ${deleting?.nom} ».`}
        onConfirm={handleDelete}
        loading={busy}
      />
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

function DhikrFormDialog({
  planningId,
  existing,
  onClose,
  onSaved,
}: {
  planningId: number;
  existing?: Dhikr;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    nom: existing?.nom ?? "",
    ordre: existing?.ordre ?? 1,
    description: existing?.description ?? "",
    repetitions: existing?.repetitions ?? 33,
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!form.nom) e2.nom = "Requis";
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setSaving(true);
    try {
      if (isEdit && existing) {
        await api(`/dhikr/${existing.id_dhikr}`, { method: "PUT", body: form });
        toast.success("Dhikr mis à jour");
      } else {
        await api("/dhikr/", {
          method: "POST",
          body: { ...form, id_planning: planningId },
        });
        toast.success("Dhikr créé");
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le dhikr" : "Ajouter un dhikr"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Nom</Label>
            <Input
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className={`mt-1.5 ${errs.nom ? "border-destructive" : ""}`}
            />
            {errs.nom && <p className="text-xs text-destructive mt-1">{errs.nom}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ordre</Label>
              <Input
                type="number"
                value={form.ordre}
                onChange={(e) => setForm({ ...form, ordre: Number(e.target.value) })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Répétitions</Label>
              <Input
                type="number"
                value={form.repetitions}
                onChange={(e) => setForm({ ...form, repetitions: Number(e.target.value) })}
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
          {!isEdit && (
            <div className="text-xs text-muted-foreground">ID Planning : {planningId}</div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
