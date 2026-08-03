"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { api, tokenStore } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const load = async () => {
    try {
      const [list, count] = await Promise.all([
        api.get<Notification[]>("/notifications"),
        api.get<{ count: number }>("/notifications/unread-count"),
      ]);
      setItems(list);
      setUnread(count.count);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    load();
    // Real-time updates via WebSocket, with polling as a resilient fallback.
    const token = tokenStore.access;
    if (token) {
      try {
        const proto = window.location.protocol === "https:" ? "wss" : "ws";
        const ws = new WebSocket(
          `${proto}://${window.location.host}/api/v1/notifications/ws?token=${token}`
        );
        ws.onmessage = () => load();
        wsRef.current = ws;
      } catch {
        /* fallback to polling */
      }
    }
    const poll = setInterval(load, 30000);
    return () => {
      clearInterval(poll);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAllRead = async () => {
    await api.post("/notifications/read-all");
    load();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-muted"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.6rem] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 animate-fade-in overflow-hidden rounded-lg border border-border bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-faint">No notifications yet</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block border-b border-border/60 px-4 py-3 text-sm hover:bg-muted",
                    !n.is_read && "bg-brand-50/50"
                  )}
                >
                  <p className="font-medium text-ink">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-ink-faint">{n.body}</p>}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
