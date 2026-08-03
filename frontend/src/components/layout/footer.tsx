import Link from "next/link";
import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { href: "/datasets", label: "Browse datasets" },
      { href: "/register", label: "Create account" },
      { href: "/documentation", label: "Documentation" },
    ],
  },
  {
    title: "TAIRI Lab",
    links: [
      { href: "/about", label: "About TAIRI" },
      { href: "/contact", label: "Contact" },
      { href: "https://ur.ac.rw", label: "University of Rwanda" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of use" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-muted/50">
      <div className="container-tight grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-faint">
            A trusted repository for AI research datasets, developed by the Trustworthy
            Artificial Intelligence Research and Innovation Lab at the University of Rwanda.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-faint">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-soft hover:text-brand-600">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-tight flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-faint sm:flex-row">
          <p>© {new Date().getFullYear()} TAIRI Lab, University of Rwanda. All rights reserved.</p>
          <p>Built for research · Self-hosted · Open science</p>
        </div>
      </div>
    </footer>
  );
}
