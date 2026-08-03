"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Database, Download, Eye, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Spinner } from "@/components/ui/primitives";
import { VisibilityBadge } from "@/components/visibility-badge";
import { api } from "@/lib/api";
import type { DatasetListItem } from "@/lib/types";
import { humanSize } from "@/lib/utils";

const STATUS_TONE: Record<string, any> = {
  approved: "success",
  pending_approval: "warning",
  rejected: "danger",
  draft: "neutral",
  deleted: "neutral",
};

export default function MyDatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetListItem[] | null>(null);

  const load = () => api.get<DatasetListItem[]>("/datasets/mine").then(setDatasets).catch(() => setDatasets([]));
  useEffect(() => { load(); }, []);

  const remove = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? Administrators can restore it later.`)) return;
    await api.delete(`/datasets/${id}`);
    toast.success("Dataset deleted");
    load();
  };

  if (datasets === null)
    return <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-6 w-6" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My datasets</h1>
          <p className="mt-1 text-sm text-ink-faint">{datasets.length} dataset{datasets.length === 1 ? "" : "s"}</p>
        </div>
        <Link href="/dashboard/upload">
          <Button><Upload size={16} /> Upload</Button>
        </Link>
      </div>

      {datasets.length === 0 ? (
        <EmptyState
          icon={<Database size={28} />}
          title="No datasets yet"
          description="Publish your first dataset to share it with the research community."
          action={<Link href="/dashboard/upload"><Button>Upload dataset</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {datasets.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/datasets/${d.slug}`} className="truncate font-semibold text-ink hover:text-brand-700">
                    {d.title}
                  </Link>
                  <Badge tone={STATUS_TONE[d.status]}>{d.status.replace("_", " ")}</Badge>
                  <VisibilityBadge visibility={d.visibility} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-ink-faint">
                  <span className="inline-flex items-center gap-1"><Download size={12} /> {d.download_count}</span>
                  <span className="inline-flex items-center gap-1"><Eye size={12} /> {d.view_count}</span>
                  <span>{d.file_count} files · {humanSize(d.total_size_bytes)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/datasets/${d.id}/edit`}>
                  <Button size="sm" variant="outline"><Pencil size={14} /> Edit</Button>
                </Link>
                <Button size="sm" variant="ghost" className="text-danger" onClick={() => remove(d.id, d.title)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
