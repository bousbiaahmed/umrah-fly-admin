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
      toast.error(err instanceof ApiError ? err.message : "Failed to load duas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns: Column<Dua>[] = [
    { key: "id", header: "ID", sortable: true, accessor: (d) => d.id_douaa },
    { key: "titre", header: "Title", sortable: true, accessor: (d) => d.titre },
    {
      key: "arabe",
      header: "Arabic",
      render: (d) => <span dir="rtl">{trunc(d.texte_arabe, 30)}</span>,
    },
    { key: "trad", header: "Translation", render: (d) => trunc(d.traduction, 50) },
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
        <p className="text-sm text-muted-foreground">{duas.length} duas</p>
        <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Dua
        </Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <DataTable
          rows={duas}
          columns={columns}
          rowKey={(d) => d.id_douaa}
          emptyMessage="No duas yet."
        />
      )}

      <Sheet open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{viewing?.titre}</SheetTitle>
            <SheetDescription>Dua #{viewing?.id_douaa}</SheetDescription>
          </SheetHeader>
          {viewing && (
            <div className="mt-6 px-4 space-y-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Arabic</div>
                <div className="text-lg leading-loose" dir="rtl">
                  {viewing.texte_arabe || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Translation</div>
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
      toast.error("Only audio files are allowed");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio", file);
      const res = await apiUpload<{ filename: string }>("/douaa/upload-audio", fd);
      setAudioFilename(res.filename);
      toast.success("Audio uploaded");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!form.titre) e2.titre = "Required";
    if (!form.texte_arabe) e2.texte_arabe = "Required";
    if (!form.traduction) e2.traduction = "Required";
    if (!audioFilename) e2.audio = "Audio file is required";
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setSaving(true);
    try {
      await api("/douaa/", {
        method: "POST",
        body: { ...form, audio_filename: audioFilename },
      });
      toast.success("Dua created");
      onAdded();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Dua</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className={`mt-1.5 ${errs.titre ? "border-destructive" : ""}`}
            />
            {errs.titre && <p className="text-xs text-destructive mt-1">{errs.titre}</p>}
          </div>
          <div>
            <Label>Arabic text</Label>
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
            <Label>Translation</Label>
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
            <Label>Audio file</Label>
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
                {audioFilename ? "Replace audio" : "Choose audio"}
              </Button>
              {audioFilename && (
                <span className="text-xs text-muted-foreground truncate">{audioFilename}</span>
              )}
            </div>
            {errs.audio && <p className="text-xs text-destructive mt-1">{errs.audio}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading} className="bg-primary hover:bg-primary/90">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
