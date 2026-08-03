"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Spinner, Textarea } from "@/components/ui/primitives";
import { api, ApiError, tokenStore } from "@/lib/api";
import type { DatasetDetail, License } from "@/lib/types";

export default function EditDatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [form, setForm] = useState({ title: "", description: "", visibility: "restricted", license_id: "", tags: "", readme: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<License[]>("/taxonomy/licenses", { auth: false }).then(setLicenses).catch(() => {});
    api.get<DatasetDetail>(`/datasets/${id}`).then((d) => {
      setDataset(d);
      setForm({
        title: d.title,
        description: d.description || "",
        visibility: d.visibility,
        license_id: d.license ? String(d.license.id) : "",
        tags: d.tags.map((t) => t.name).join(", "),
        readme: d.readme || "",
      });
    }).catch(() => toast.error("Could not load dataset"));
  }, [id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/datasets/${id}`, {
        title: form.title,
        description: form.description,
        visibility: form.visibility,
        license_id: form.license_id ? Number(form.license_id) : null,
        readme: form.readme,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Dataset updated");
      router.push("/dashboard/datasets");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const addVersionAndUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !dataset) return;
    try {
      // Create a new minor version, then upload the files into it.
      const vfd = new FormData();
      vfd.append("changelog", "Files added via edit");
      const version = await api.upload<{ id: number }>(`/datasets/${dataset.id}/versions`, vfd);
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      fd.append("version_id", String(version.id));
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/v1/datasets/${dataset.id}/files`);
      xhr.setRequestHeader("Authorization", `Bearer ${tokenStore.access}`);
      xhr.onload = () => {
        if (xhr.status < 300) { toast.success("New version uploaded"); router.refresh(); }
        else toast.error("Upload failed");
      };
      xhr.send(fd);
    } catch {
      toast.error("Could not create version");
    }
  };

  if (!dataset)
    return <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-6 w-6" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Edit dataset</h1>
      <p className="mt-1 text-sm text-ink-faint">Current version: v{dataset.versions.find((v) => v.is_current)?.version ?? "1.0"}</p>

      <form onSubmit={save} className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6">
        <div>
          <Label>Title</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Visibility</Label>
            <Select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="public_metadata">Public metadata</option>
              <option value="private">Private</option>
            </Select>
          </div>
          <div>
            <Label>License</Label>
            <Select value={form.license_id} onChange={(e) => setForm({ ...form, license_id: e.target.value })}>
              <option value="">None</option>
              {licenses.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label>Tags (comma separated)</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </div>
        <div>
          <Label>README</Label>
          <Textarea className="min-h-[120px] font-mono text-xs" value={form.readme} onChange={(e) => setForm({ ...form, readme: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/datasets")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>

      <div className="mt-6 rounded-lg border border-border bg-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-faint">Add a new version</h2>
        <p className="mt-1 text-xs text-ink-faint">Uploading files creates a new minor version (e.g. 1.1). Old versions remain accessible.</p>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 px-6 py-8 hover:border-brand-300"
        >
          <UploadCloud size={26} className="text-brand-500" />
          <span className="mt-2 text-sm font-medium">Upload new files</span>
        </button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => addVersionAndUpload(e.target.files)} />
      </div>
    </div>
  );
}
