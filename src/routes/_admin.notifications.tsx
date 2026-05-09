import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { Spinner } from "@/components/admin/Feedback";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_admin/notifications")({
  component: NotificationsPage,
});

type Notif = {
  id_notification: number;
  titre: string;
  message: string;
  categorie?: string;
  type?: string;
  lue?: boolean;
  is_global?: boolean;
  date_envoi?: string;
  id_utilisateur?: number | null;
};

function trunc(s: string | undefined, n = 50) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Notif | null>(null);
  const [deleting, setDeleting] = useState<Notif | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ notifications: Notif[] } | Notif[]>("/notifications/");
      const list = Array.isArray(data) ? data : data?.notifications ?? [];
      setNotifs(list);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec du chargement des notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api(`/notifications/${deleting.id_notification}`, { method: "DELETE" });
      toast.success("Notification supprimée");
      setNotifs((p) => p.filter((n) => n.id_notification !== deleting.id_notification));
      setDeleting(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la suppression");
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<Notif>[] = [
    { key: "titre", header: "Titre", sortable: true, accessor: (n) => n.titre },
    { key: "msg", header: "Message", render: (n) => trunc(n.message, 50) },
    { key: "cat", header: "Catégorie", sortable: true, accessor: (n) => n.categorie ?? "—" },
    { key: "type", header: "Type", accessor: (n) => n.type ?? "—" },
    {
      key: "global",
      header: "Globale",
      render: (n) => (
        <Badge
          variant={n.is_global ? "default" : "secondary"}
          className={n.is_global ? "bg-gold text-gold-foreground" : ""}
        >
          {n.is_global ? "Oui" : "Non"}
        </Badge>
      ),
    },
    {
      key: "lue",
      header: "Statut",
      render: (n) => (
        <Badge variant={n.lue ? "secondary" : "default"}>{n.lue ? "Lue" : "Non lue"}</Badge>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      accessor: (n) => n.date_envoi ?? "",
      render: (n) => (n.date_envoi ? new Date(n.date_envoi).toLocaleString() : "—"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (n) => (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => setViewing(n)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(n)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SendForm onSent={load} />

      <div>
        <h3 className="text-base font-semibold mb-3">Toutes les notifications</h3>
        {loading ? (
          <Spinner />
        ) : (
          <DataTable
            rows={notifs}
            columns={columns}
            rowKey={(n) => n.id_notification}
            emptyMessage="Aucune notification pour le moment."
          />
        )}
      </div>

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{viewing?.titre}</SheetTitle>
            <SheetDescription>Notification #{viewing?.id_notification}</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="mt-6 px-4 space-y-3 text-sm">
              <Field label="Message" value={viewing.message} />
              <Field label="Catégorie" value={viewing.categorie ?? "—"} />
              <Field label="Type" value={viewing.type ?? "—"} />
              <Field label="Globale" value={viewing.is_global ? "Oui" : "Non"} />
              <Field label="ID Utilisateur" value={String(viewing.id_utilisateur ?? "—")} />
              <Field label="Lue" value={viewing.lue ? "Oui" : "Non"} />
              <Field
                label="Envoyée le"
                value={viewing.date_envoi ? new Date(viewing.date_envoi).toLocaleString() : "—"}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Supprimer la notification ?"
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
      <div className="text-foreground break-words whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function SendForm({ onSent }: { onSent: () => void }) {
  const [form, setForm] = useState({
    titre: "",
    message: "",
    categorie: "info",
    type: "",
    sendToAll: true,
    userId: "",
  });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!form.titre.trim()) e2.titre = "Requis";
    if (!form.message.trim()) e2.message = "Requis";
    if (!form.sendToAll && !form.userId) e2.userId = "Requis";
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setSending(true);
    try {
      await api("/notifications/admin/send", {
        method: "POST",
        body: {
          titre: form.titre,
          message: form.message,
          categorie: form.categorie,
          type: form.type || undefined,
          sendToAll: form.sendToAll,
          userId: form.sendToAll ? null : Number(form.userId),
        },
      });
      toast.success(
        form.sendToAll ? "Notification globale envoyée" : "Notification envoyée à l'utilisateur",
      );
      setForm({
        titre: "",
        message: "",
        categorie: "info",
        type: "",
        sendToAll: true,
        userId: "",
      });
      onSent();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de l'envoi");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Send className="h-4 w-4 text-gold" />
        <h3 className="font-semibold">Envoyer une notification</h3>
      </div>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Titre</Label>
          <Input
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
            className={`mt-1.5 ${errs.titre ? "border-destructive" : ""}`}
          />
          {errs.titre && <p className="text-xs text-destructive mt-1">{errs.titre}</p>}
        </div>
        <div className="md:col-span-2">
          <Label>Message</Label>
          <Textarea
            rows={3}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            className={`mt-1.5 ${errs.message ? "border-destructive" : ""}`}
          />
          {errs.message && <p className="text-xs text-destructive mt-1">{errs.message}</p>}
        </div>
        <div>
          <Label>Catégorie</Label>
          <Select
            value={form.categorie}
            onValueChange={(v) => setForm({ ...form, categorie: v })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="alert">Alerte</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="rappel">Rappel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type (optionnel)</Label>
          <Input
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="mt-1.5"
          />
        </div>
        <div className="flex items-center gap-3 md:col-span-2">
          <Switch
            checked={form.sendToAll}
            onCheckedChange={(v) => setForm({ ...form, sendToAll: v })}
          />
          <Label className="!mt-0">Envoyer à tous les utilisateurs (globale)</Label>
        </div>
        {!form.sendToAll && (
          <div className="md:col-span-2">
            <Label>ID Utilisateur</Label>
            <Input
              type="number"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              className={`mt-1.5 ${errs.userId ? "border-destructive" : ""}`}
            />
            {errs.userId && (
              <p className="text-xs text-destructive mt-1">{errs.userId}</p>
            )}
          </div>
        )}
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={sending} className="bg-primary hover:bg-primary/90">
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Envoyer
          </Button>
        </div>
      </form>
    </div>
  );
}
