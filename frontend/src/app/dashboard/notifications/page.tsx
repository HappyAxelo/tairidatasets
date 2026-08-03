"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);

  const load = () => api.get<Notification[]>("/notifications").then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const markAll = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  if (items === null)
    return <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-6 w-6" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {items.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={markAll}>
            <CheckCheck size={15} /> Mark all read
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Bell size={26} />} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.link || "#"}
              className={cn("block px-5 py-4 transition hover:bg-muted", !n.is_read && "bg-brand-50/40")}
              onClick={async () => { if (!n.is_read) { await api.post(`/notifications/${n.id}/read`); load(); } }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-sm text-ink-faint">{n.body}</p>}
                </div>
                <span className="flex-none text-xs text-ink-faint">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
