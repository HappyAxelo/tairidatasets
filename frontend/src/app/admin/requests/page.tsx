"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { Badge, EmptyState, Select, Spinner } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import type { AccessRequest } from "@/lib/types";

const TONE: Record<string, any> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  more_info_requested: "brand",
  revoked: "neutral",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[] | null>(null);
  const [status, setStatus] = useState("");

  const load = () => {
    const qs = status ? `?status=${status}` : "";
    api.get<AccessRequest[]>(`/admin/requests${qs}`).then(setRequests).catch(() => setRequests([]));
  };
  useEffect(load, [status]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Access requests</h1>
          <p className="mt-1 text-sm text-ink-faint">All access requests across the platform.</p>
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      {requests === null ? (
        <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-6 w-6" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={<ClipboardList size={26} />} title="No requests found" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-4 py-3 font-medium">Requester</th>
                <th className="px-4 py-3 font-medium">Dataset</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.requester.full_name || r.requester.username}</td>
                  <td className="px-4 py-3 text-ink-faint">#{r.dataset_id}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink-soft">{r.purpose}</td>
                  <td className="px-4 py-3"><Badge tone={TONE[r.status]}>{r.status.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3 text-ink-faint">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
