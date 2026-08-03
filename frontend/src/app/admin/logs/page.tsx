"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ScrollText } from "lucide-react";
import { Badge, EmptyState, Spinner } from "@/components/ui/primitives";
import { api } from "@/lib/api";

interface AuditLog {
  id: number;
  actor_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  detail?: string;
  ip_address?: string;
  created_at: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);

  useEffect(() => {
    api.get<AuditLog[]>("/admin/audit-logs").then(setLogs).catch(() => setLogs([]));
  }, []);

  if (logs === null)
    return <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-6 w-6" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Audit logs</h1>
      <p className="mt-1 text-sm text-ink-faint">Chronological record of all administrative and user actions.</p>

      <div className="mt-6">
        {logs.length === 0 ? (
          <EmptyState icon={<ScrollText size={26} />} title="No activity yet" />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3"><Badge tone="outline">{l.action}</Badge></td>
                    <td className="px-4 py-3 text-ink-faint">
                      {l.entity_type ? `${l.entity_type}${l.entity_id ? ` #${l.entity_id}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-faint">{l.actor_id ? `#${l.actor_id}` : "system"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-faint">{l.ip_address || "—"}</td>
                    <td className="px-4 py-3 text-ink-faint">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
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
