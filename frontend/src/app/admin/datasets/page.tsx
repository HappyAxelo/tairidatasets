"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/primitives";
import { api } from "@/lib/api";

interface Pending {
  id: number;
  slug: string;
  title: string;
  owner: string;
  created_at: string;
}

export default function AdminModerationPage() {
  const [pending, setPending] = useState<Pending[] | null>(null);

  const load = () => api.get<Pending[]>("/admin/datasets/pending").then(setPending).catch(() => setPending([]));
  useEffect(() => { load(); }, []);

  const approve = async (id: number) => {
    await api.post(`/admin/datasets/${id}/approve`);
    toast.success("Dataset approved");
    load();
  };
  const reject = async (id: number) => {
    const reason = prompt("Reason for rejection (optional):") ?? "";
    await api.post(`/admin/datasets/${id}/reject`, { reason });
    toast.success("Dataset rejected");
    load();
  };

  if (pending === null)
    return <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-6 w-6" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dataset moderation</h1>
      <p className="mt-1 text-sm text-ink-faint">Review and approve datasets awaiting publication.</p>

      <div className="mt-6">
        {pending.length === 0 ? (
          <EmptyState icon={<Check size={26} />} title="All caught up" description="No datasets pending approval." />
        ) : (
          <div className="space-y-3">
            {pending.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div>
                  <Link href={`/datasets/${d.slug}`} className="font-semibold hover:text-brand-700">{d.title}</Link>
                  <p className="text-xs text-ink-faint">by {d.owner} · {new Date(d.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-danger" onClick={() => reject(d.id)}>
                    <X size={14} /> Reject
                  </Button>
                  <Button size="sm" onClick={() => approve(d.id)}>
                    <Check size={14} /> Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
