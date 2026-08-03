"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./navbar";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function DashboardShell({
  items,
  title,
  requireRoles,
  children,
}: {
  items: NavItem[];
  title: string;
  requireRoles?: string[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${pathname}`);
    } else if (requireRoles && !requireRoles.includes(user.role.name)) {
      router.replace("/dashboard");
    }
  }, [loading, user, requireRoles, router, pathname]);

  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center text-brand-500">
        <Spinner className="h-7 w-7" />
      </div>
    );

  if (requireRoles && !requireRoles.includes(user.role.name)) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="container-tight flex flex-1 gap-8 py-8">
        <aside className="hidden w-56 flex-none md:block">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {title}
          </p>
          <nav className="space-y-0.5">
            {items.map((item) => {
              const active =
                item.href === pathname ||
                (item.href !== "/dashboard" && item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-ink-soft hover:bg-muted hover:text-ink"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
