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
    <footer className="mt-20 bg-[#0B6E5E] text-white">
      {/* Thin stripe in the logo colours (green, gold, sky blue) */}
      <div className="h-1 bg-gradient-to-r from-[#8CC63F] via-[#F5B800] to-[#29A3DC]" />

      <div className="container-tight grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          {/* White strip keeps the three logos readable on the green background */}
          <div className="inline-block rounded-xl bg-white px-4 py-3 shadow-sm">
            <Logo />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#CDEBE5]">
            A trusted repository for AI research datasets, developed by the Trustworthy
            Artificial Intelligence Research and Innovation Lab at the University of Rwanda.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#A8DE72]">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm font-semibold text-white transition-colors hover:text-[#FBD85D]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/15 bg-[#084F43]">
        <div className="container-tight flex flex-col items-center justify-between gap-2 py-5 text-xs text-[#BFE3D9] sm:flex-row">
          <p>© {new Date().getFullYear()} TAIRI Lab, University of Rwanda. All rights reserved.</p>
          <p>Built for research · Self-hosted · Open science</p>
        </div>
      </div>
    </footer>
  );
}
