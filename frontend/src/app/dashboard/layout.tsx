"use client";

import { Bell, Database, Inbox, LayoutDashboard, Upload, User } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { href: "/dashboard/datasets", label: "My datasets", icon: <Database size={16} /> },
  { href: "/dashboard/upload", label: "Upload", icon: <Upload size={16} /> },
  { href: "/dashboard/requests", label: "Access requests", icon: <Inbox size={16} /> },
  { href: "/dashboard/notifications", label: "Notifications", icon: <Bell size={16} /> },
  { href: "/dashboard/profile", label: "Profile", icon: <User size={16} /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell items={ITEMS} title="Dashboard">
      {children}
    </DashboardShell>
  );
}
