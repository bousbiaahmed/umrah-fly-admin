import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, Plus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, apiUpload, ApiError } from "@/lib/api";
import { Spinner } from "@/components/admin/Feedback";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export const Route = createFileRoute("/_admin/duas")({
  component: DuasPage,
});

type Dua = {
  id_douaa: number;
  titre: string;
  texte_arabe?: string;
  traduction?: string;
  audio_url?: string | null;
};

function trunc(s: string | undefined, n = 50) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function DuasPage() {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Dua | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<Dua[]>("/douaa/all");
      setDuas(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec du chargement des douaa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: Column<Dua>[] = [
    { key: "id", header: "ID", sortable: true, accessor: (d) => d.id_douaa },
    { key: "titre", header: "Titre", sortable: true, accessor: (d) => d.titre },
    {
      key: "arabe",
      header: "Arabe",
      render: (d) => <span dir="rtl">{trunc(d.texte_arabe, 30)}</span>,
    },
    { key: "trad", header: "Traduction", render: (d) => trunc(d.traduction, 50) },
    {
      key: "audio",
      header: "Audio",
      render: (d) => (d.audio_url ? "🎵" : "—"),
    },
    {
      key: "actions",
      header: "Actions",
      render: (d) => (
        <Button size="icon" variant="ghost" onClick={() => setViewing(d)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{duas.length} douaa</p>
        <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une Douaa
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <DataTable
          rows={duas}
          columns={columns}
          rowKey={(d) => d.id_douaa}
          emptyMessage="Aucune douaa pour le moment."
        />
      )}

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{viewing?.titre}</SheetTitle>
            <SheetDescription>Douaa #{viewing?.id_douaa}</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="mt-6 px-4 space-y-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Arabe</div>
                <div className="text-lg leading-loose" dir="rtl">
                  {viewing.texte_arabe || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Traduction</div>
                <div>{viewing.traduction || "—"}</div>
              </div>
              {viewing.audio_url && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Audio</div>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={viewing.audio_url} className="w-full" />
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {adding && (
        <AddDuaDialog
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddDuaDialog({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ titre: "", texte_arabe: "", traduction: "" });
  const [audioFilename, setAudioFilename] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      toast.error("Seuls les fichiers audio sont autorisés");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio", file);
      const res = await apiUpload<{ filename: string }>("/douaa/upload-audio", fd);
      setAudioFilename(res.filename);
      toast.success("Audio téléversé");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec du téléversement");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!form.titre) e2.titre = "Requis";
    if (!form.texte_arabe) e2.texte_arabe = "Requis";
    if (!form.traduction) e2.traduction = "Requis";
    if (!audioFilename) e2.audio = "Le fichier audio est requis";
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setSaving(true);
    try {
      await api("/douaa/", {
        method: "POST",
        body: { ...form, audio_filename: audioFilename },
      });
      toast.success("Douaa créée");
      onAdded();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Échec de la création");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une Douaa</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Titre</Label>
            <Input
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className={`mt-1.5 ${errs.titre ? "border-destructive" : ""}`}
            />
            {errs.titre && <p className="text-xs text-destructive mt-1">{errs.titre}</p>}
          </div>
          <div>
            <Label>Texte arabe</Label>
            <Textarea
              dir="rtl"
              rows={3}
              value={form.texte_arabe}
              onChange={(e) => setForm({ ...form, texte_arabe: e.target.value })}
              className={`mt-1.5 ${errs.texte_arabe ? "border-destructive" : ""}`}
            />
            {errs.texte_arabe && (
              <p className="text-xs text-destructive mt-1">{errs.texte_arabe}</p>
            )}
          </div>
          <div>
            <Label>Traduction</Label>
            <Textarea
              rows={3}
              value={form.traduction}
              onChange={(e) => setForm({ ...form, traduction: e.target.value })}
              className={`mt-1.5 ${errs.traduction ? "border-destructive" : ""}`}
            />
            {errs.traduction && (
              <p className="text-xs text-destructive mt-1">{errs.traduction}</p>
            )}
          </div>
          <div>
            <Label>Fichier audio</Label>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              onChange={handleFile}
              className="hidden"
            />
            <div className="mt-1.5 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {audioFilename ? "Remplacer l'audio" : "Choisir un audio"}
              </Button>
              {audioFilename && (
                <span className="text-xs text-muted-foreground truncate">{audioFilename}</span>
              )}
            </div>
            {errs.audio && <p className="text-xs text-destructive mt-1">{errs.audio}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving || uploading} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
