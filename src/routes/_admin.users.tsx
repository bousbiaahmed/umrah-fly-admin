import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Spinner } from "@/components/admin/Feedback";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_admin/users")({
  component: UsersPage,
});

type User = {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  langue?: string;
  type_compte?: string;
  date_inscription?: string;
  role: string;
  avatar?: string | null;
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api<User[]>("/utilisateurs/");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      `${u.nom} ${u.prenom}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/utilisateurs/${deleting.id_utilisateur}`, { method: "DELETE" });
      toast.success("Utilisateur supprimé");
      setUsers((prev) => prev.filter((u) => u.id_utilisateur !== deleting.id_utilisateur));
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la suppression");
    } finally {
      setBusy(false);
    }
  };

  const handleEdited = (updated: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id_utilisateur === updated.id_utilisateur ? { ...u, ...updated } : u)),
    );
    setEditing(null);
  };

  const columns: Column<User>[] = [
    {
      key: "avatar",
      header: "",
      render: (u) => (
        <Avatar className="h-9 w-9">
          {u.avatar && <AvatarImage src={u.avatar} alt={u.nom} />}
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {(u.prenom?.[0] ?? "") + (u.nom?.[0] ?? "")}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: "name",
      header: "Nom complet",
      sortable: true,
      accessor: (u) => `${u.nom} ${u.prenom}`,
    },
    { key: "email", header: "E-mail", sortable: true, accessor: (u) => u.email },
    { key: "telephone", header: "Téléphone", accessor: (u) => u.telephone ?? "—" },
    {
      key: "role",
      header: "Rôle",
      sortable: true,
      accessor: (u) => u.role,
      render: (u) => (
        <Badge
          variant={u.role === "ADMIN" ? "default" : "secondary"}
          className={u.role === "ADMIN" ? "bg-gold text-gold-foreground" : ""}
        >
          {u.role}
        </Badge>
      ),
    },
    {
      key: "date",
      header: "Inscription",
      sortable: true,
      accessor: (u) => u.date_inscription ?? "",
      render: (u) =>
        u.date_inscription ? new Date(u.date_inscription).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (u) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => setViewing(u)} title="Voir">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(u)} title="Modifier">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDeleting(u)}
            title="Supprimer"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou e-mail…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} utilisateurs</div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(u) => u.id_utilisateur}
          emptyMessage="Aucun utilisateur trouvé."
        />
      )}

      {/* View drawer */}
      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Détails de l'utilisateur</SheetTitle>
            <SheetDescription>Informations complètes du profil</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="mt-6 space-y-3 px-4 text-sm">
              <Field label="ID" value={String(viewing.id_utilisateur)} />
              <Field label="Prénom" value={viewing.prenom} />
              <Field label="Nom" value={viewing.nom} />
              <Field label="E-mail" value={viewing.email} />
              <Field label="Téléphone" value={viewing.telephone ?? "—"} />
              <Field label="Langue" value={viewing.langue ?? "—"} />
              <Field label="Type de compte" value={viewing.type_compte ?? "—"} />
              <Field label="Rôle" value={viewing.role} />
              <Field
                label="Inscription"
                value={
                  viewing.date_inscription
                    ? new Date(viewing.date_inscription).toLocaleString()
                    : "—"
                }
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit modal */}
      {editing && (
        <EditUserDialog
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={handleEdited}
        />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer l'utilisateur ?"
        description={`Cela supprimera définitivement ${deleting?.prenom ?? ""} ${deleting?.nom ?? ""}.`}
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

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: (u: User) => void;
}) {
  const [form, setForm] = useState({
    nom: user.nom ?? "",
    prenom: user.prenom ?? "",
    email: user.email ?? "",
    telephone: user.telephone ?? "",
    langue: user.langue ?? "",
    type_compte: user.type_compte ?? "",
    role: user.role ?? "USER",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!form.nom) e2.nom = "Requis";
    if (!form.prenom) e2.prenom = "Requis";
    if (!form.email) e2.email = "Requis";
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setSaving(true);
    try {
      await api(`/utilisateurs/${user.id_utilisateur}`, { method: "PUT", body: form });
      toast.success("Utilisateur mis à jour");
      onSaved({ ...user, ...form });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Prénom"
            value={form.prenom}
            onChange={(v) => setForm({ ...form, prenom: v })}
            error={errs.prenom}
          />
          <FormField
            label="Nom"
            value={form.nom}
            onChange={(v) => setForm({ ...form, nom: v })}
            error={errs.nom}
          />
          <FormField
            label="E-mail"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            error={errs.email}
            className="sm:col-span-2"
          />
          <FormField
            label="Téléphone"
            value={form.telephone}
            onChange={(v) => setForm({ ...form, telephone: v })}
          />
          <FormField
            label="Langue"
            value={form.langue}
            onChange={(v) => setForm({ ...form, langue: v })}
          />
          <FormField
            label="Type de compte"
            value={form.type_compte}
            onChange={(v) => setForm({ ...form, type_compte: v })}
          />
          <div>
            <Label>Rôle</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">USER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  value,
  onChange,
  error,
  className,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  className?: string;
  type?: string;
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 ${error ? "border-destructive" : ""}`}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
