"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, RotateCcw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/primitives";
import { api } from "@/lib/api";

interface AdminDataset {
  id: number;
  slug: string;
  title: string;
  owner: string | null;
  status: string;
  is_deleted: boolean;
  visibility: string;
  download_count: number;
  file_count: number;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  pending_approval: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  deleted: "bg-slate-100 text-slate-500 ring-slate-500/20",
  draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function StatusBadge({ status, deleted }: { status: string; deleted: boolean }) {
  const key = deleted ? "deleted" : status;
  const label = deleted ? "Deleted" : status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
        STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      {label}
    </span>
  );
}

export default function AdminDatasetsPage() {
  const [datasets, setDatasets] = useState<AdminDataset[] | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = () =>
    api.get<AdminDataset[]>("/admin/datasets").then(setDatasets).catch(() => setDatasets([]));
  useEffect(() => {
    load();
  }, []);

  const act = async (id: number, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const approve = (id: number) => act(id, () => api.post(`/admin/datasets/${id}/approve`), "Dataset approved");
  const reject = (id: number) => {
    const reason = prompt("Reason for rejection (optional):") ?? "";
    return act(id, () => api.post(`/admin/datasets/${id}/reject`, { reason }), "Dataset rejected");
  };
  const restore = (id: number) => act(id, () => api.post(`/admin/datasets/${id}/restore`), "Dataset restored");

  const softDelete = (d: AdminDataset) => {
    if (!confirm(`Delete "${d.title}"?\n\nIt will be hidden from the site but can be restored later.`)) return;
    return act(d.id, () => api.delete(`/admin/datasets/${d.id}`), "Dataset deleted (restorable)");
  };
  const hardDelete = (d: AdminDataset) => {
    if (!confirm(`Permanently delete "${d.title}"?\n\nThis removes the dataset and its files for good. This CANNOT be undone.`)) return;
    return act(d.id, () => api.delete(`/admin/datasets/${d.id}?permanent=true`), "Dataset permanently deleted");
  };

  if (datasets === null)
    return (
      <div className="flex justify-center py-24 text-brand-500">
        <Spinner className="h-6 w-6" />
      </div>
    );

  const pendingCount = datasets.filter((d) => d.status === "pending_approval" && !d.is_deleted).length;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Approve, reject, delete or restore datasets across the platform.
        {pendingCount > 0 && (
          <span className="ml-1 font-medium text-amber-700">{pendingCount} awaiting approval.</span>
        )}
      </p>

      <div className="mt-6">
        {datasets.length === 0 ? (
          <EmptyState title="No datasets" description="No datasets have been created yet." />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Dataset</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Files</th>
                  <th className="px-4 py-3 font-medium">Downloads</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {datasets.map((d) => (
                  <tr key={d.id} className={d.is_deleted ? "bg-muted/30" : undefined}>
                    <td className="px-4 py-3">
                      <Link href={`/datasets/${d.slug}`} className="font-medium hover:text-brand-700">
                        {d.title}
                      </Link>
                      <p className="text-xs text-ink-faint">{new Date(d.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{d.owner ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} deleted={d.is_deleted} />
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{d.file_count}</td>
                    <td className="px-4 py-3 text-ink-soft">{d.download_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!d.is_deleted && d.status === "pending_approval" && (
                          <>
                            <Button size="sm" variant="outline" className="text-danger" disabled={busy === d.id} onClick={() => reject(d.id)}>
                              <X size={14} /> Reject
                            </Button>
                            <Button size="sm" disabled={busy === d.id} onClick={() => approve(d.id)}>
                              <Check size={14} /> Approve
                            </Button>
                          </>
                        )}
                        {d.is_deleted ? (
                          <>
                            <Button size="sm" variant="outline" disabled={busy === d.id} onClick={() => restore(d.id)}>
                              <RotateCcw size={14} /> Restore
                            </Button>
                            <Button size="sm" variant="outline" className="text-danger" disabled={busy === d.id} onClick={() => hardDelete(d)}>
                              <Trash2 size={14} /> Delete forever
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" className="text-danger" disabled={busy === d.id} onClick={() => softDelete(d)}>
                            <Trash2 size={14} /> Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
