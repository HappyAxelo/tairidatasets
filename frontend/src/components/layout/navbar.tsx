"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Search, Upload, User, X } from "lucide-react";
import { Logo } from "./logo";
import { NotificationBell } from "./notification-bell";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/datasets", label: "Browse" },
  { href: "/about", label: "About" },
  { href: "/documentation", label: "Docs" },
];

export function Navbar() {
  const { user, logout, isRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/datasets?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="container-tight flex h-16 items-center gap-4">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-ink-soft hover:bg-muted hover:text-ink",
                pathname.startsWith(l.href) && "text-brand-700"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 lg:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search datasets..."
              className="input-base h-9 pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          {user ? (
            <>
              {isRole("student_researcher", "super_admin") && (
                <Link href="/dashboard/upload" className="hidden sm:block">
                  <Button size="sm" variant="subtle">
                    <Upload size={15} /> Upload
                  </Button>
                </Link>
              )}
              <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-md p-1 hover:bg-muted"
                >
                  <Avatar name={user.full_name || user.username} src={user.avatar_url} size={32} />
                  <ChevronDown size={14} className="text-ink-faint" />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 top-12 z-50 w-56 animate-fade-in overflow-hidden rounded-lg border border-border bg-white shadow-pop"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-semibold">{user.full_name || user.username}</p>
                      <p className="truncate text-xs text-ink-faint">{user.email}</p>
                      <span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[0.65rem] font-medium capitalize text-brand-700">
                        {user.role.name.replace("_", " ")}
                      </span>
                    </div>
                    <MenuLink href="/dashboard" icon={<LayoutDashboard size={15} />} label="Dashboard" onClick={() => setMenuOpen(false)} />
                    <MenuLink href="/dashboard/profile" icon={<User size={15} />} label="Profile" onClick={() => setMenuOpen(false)} />
                    {isRole("super_admin") && (
                      <MenuLink href="/admin" icon={<LayoutDashboard size={15} />} label="Admin console" onClick={() => setMenuOpen(false)} />
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm text-danger hover:bg-muted"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Create account</Button>
              </Link>
            </div>
          )}

          <button
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-muted md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-white px-6 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-sm font-medium text-ink-soft"
            >
              {l.label}
            </Link>
          ))}
          {!user && (
            <div className="mt-2 flex gap-2">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button size="sm" className="w-full">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-soft hover:bg-muted"
    >
      {icon} {label}
    </Link>
  );
}
