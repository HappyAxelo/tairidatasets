"use client";

import { ClipboardList, Database, LayoutDashboard, ScrollText, Users } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Analytics", icon: <LayoutDashboard size={16} /> },
  { href: "/admin/users", label: "Users", icon: <Users size={16} /> },
  { href: "/admin/datasets", label: "Datasets", icon: <Database size={16} /> },
  { href: "/admin/requests", label: "Requests", icon: <ClipboardList size={16} /> },
  { href: "/admin/logs", label: "Audit logs", icon: <ScrollText size={16} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell items={ITEMS} title="Administration" requireRoles={["super_admin"]}>
      {children}
    </DashboardShell>
  );
}
