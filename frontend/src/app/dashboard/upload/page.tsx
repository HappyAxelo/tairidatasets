"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { File as FileIcon, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/primitives";
import { api, ApiError, tokenStore } from "@/lib/api";
import type { DatasetDetail, License, Named } from "@/lib/types";
import { humanSize } from "@/lib/utils";

const VISIBILITIES = [
  { value: "public", label: "Public — anyone can download" },
  { value: "restricted", label: "Restricted — download on approval" },
  { value: "public_metadata", label: "Public metadata — details visible, files on request" },
  { value: "private", label: "Private — only me" },
];

export default function UploadPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [areas, setAreas] = useState<Named[]>([]);
  const [categories, setCategories] = useState<Named[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [departments, setDepartments] = useState<Named[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    authors: "",
    affiliation: "University of Rwanda",
    contact_email: "",
    keywords: "",
    funding_agency: "",
    doi: "",
    publication_link: "",
    readme: "",
    visibility: "restricted",
    research_area_id: "",
    category_id: "",
    license_id: "",
    department_id: "",
    tags: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Named[]>("/taxonomy/research-areas", { auth: false }).then(setAreas).catch(() => {});
    api.get<Named[]>("/taxonomy/categories", { auth: false }).then(setCategories).catch(() => {});
    api.get<License[]>("/taxonomy/licenses", { auth: false }).then(setLicenses).catch(() => {});
    api.get<Named[]>("/taxonomy/departments", { auth: false }).then(setDepartments).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<any>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const uploadFiles = (datasetId: number) =>
    new Promise<void>((resolve, reject) => {
      if (files.length === 0) return resolve();
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/v1/datasets/${datasetId}/files`);
      xhr.setRequestHeader("Authorization", `Bearer ${tokenStore.access}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(fd);
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        research_area_id: form.research_area_id ? Number(form.research_area_id) : undefined,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        license_id: form.license_id ? Number(form.license_id) : undefined,
        department_id: form.department_id ? Number(form.department_id) : undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      const dataset = await api.post<DatasetDetail>("/datasets", payload);
      await uploadFiles(dataset.id);
      toast.success("Dataset submitted", {
        description: "It is now pending administrator approval.",
      });
      router.push(`/datasets/${dataset.slug}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create dataset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">Upload dataset</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Publish a new research dataset. It will be reviewed before appearing publicly.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <Section title="Basic information">
          <Field label="Title *">
            <Input required value={form.title} onChange={set("title")} placeholder="e.g. Rice Disease Image Dataset" />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={set("description")} placeholder="Describe the dataset, how it was collected and its structure..." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Authors">
              <Input value={form.authors} onChange={set("authors")} placeholder="A. Uwase, E. Niyonzima" />
            </Field>
            <Field label="Affiliation">
              <Input value={form.affiliation} onChange={set("affiliation")} />
            </Field>
            <Field label="Contact email">
              <Input type="email" value={form.contact_email} onChange={set("contact_email")} />
            </Field>
            <Field label="Keywords (comma separated)">
              <Input value={form.keywords} onChange={set("keywords")} placeholder="agriculture, images" />
            </Field>
          </div>
        </Section>

        <Section title="Classification">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Research area">
              <Select value={form.research_area_id} onChange={set("research_area_id")}>
                <option value="">Select area</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
            <Field label="Category">
              <Select value={form.category_id} onChange={set("category_id")}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="License">
              <Select value={form.license_id} onChange={set("license_id")}>
                <option value="">Select license</option>
                {licenses.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
              </Select>
            </Field>
            <Field label="Department">
              <Select value={form.department_id} onChange={set("department_id")}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Tags (comma separated)">
              <Input value={form.tags} onChange={set("tags")} placeholder="images, plant-disease" />
            </Field>
            <Field label="Visibility">
              <Select value={form.visibility} onChange={set("visibility")}>
                {VISIBILITIES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </Select>
            </Field>
          </div>
        </Section>

        <Section title="Additional metadata">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Funding agency">
              <Input value={form.funding_agency} onChange={set("funding_agency")} />
            </Field>
            <Field label="DOI (optional)">
              <Input value={form.doi} onChange={set("doi")} placeholder="10.xxxx/xxxxx" />
            </Field>
            <Field label="Publication link">
              <Input value={form.publication_link} onChange={set("publication_link")} placeholder="https://..." />
            </Field>
          </div>
          <Field label="README (Markdown supported)">
            <Textarea value={form.readme} onChange={set("readme")} className="min-h-[140px] font-mono text-xs" placeholder="# Dataset title..." />
          </Field>
        </Section>

        <Section title="Files">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            onClick={() => fileInput.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
              dragging ? "border-brand-400 bg-brand-50" : "border-border bg-muted/40 hover:border-brand-300"
            }`}
          >
            <UploadCloud size={30} className="text-brand-500" />
            <p className="mt-3 text-sm font-medium text-ink">Drag & drop files here</p>
            <p className="mt-0.5 text-xs text-ink-faint">or click to browse — any file type, no size restrictions</p>
            <input ref={fileInput} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <FileIcon size={15} className="flex-none text-ink-faint" />
                    <span className="truncate">{f.name}</span>
                    <span className="flex-none text-xs text-ink-faint">{humanSize(f.size)}</span>
                  </span>
                  <button type="button" onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="text-ink-faint hover:text-danger">
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {submitting && progress > 0 && (
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-xs text-ink-faint">Uploading… {progress}%</p>
            </div>
          )}
        </Section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/datasets")}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Publishing…" : "Publish dataset"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-faint">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
