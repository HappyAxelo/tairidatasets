import Link from "next/link";
import {
  Database,
  FileText,
  Presentation,
  GraduationCap,
  BookOpen,
  ArrowRight,
} from "lucide-react";

const SECTIONS = [
  {
    href: "/research/datasets",
    title: "Datasets",
    desc: "Browse research datasets shared by TAIRI and its partners.",
    icon: Database,
  },
  {
    href: "/research/publications",
    title: "Publication Papers",
    desc: "Peer-reviewed journal articles and published research.",
    icon: FileText,
  },
  {
    href: "/research/conferences",
    title: "Conference Papers",
    desc: "Papers presented at national and international conferences.",
    icon: Presentation,
  },
  {
    href: "/research/masters-theses",
    title: "Master's Theses",
    desc: "Completed master's research from our students.",
    icon: BookOpen,
  },
  {
    href: "/research/phd-theses",
    title: "PhD Theses",
    desc: "Doctoral dissertations and long-form research.",
    icon: GraduationCap,
  },
];

export default function ResearchPage() {
  return (
    <main className="container-tight py-10 md:py-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">Research</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft md:text-base">
          Explore the datasets, papers and theses produced by the Trustworthy
          Artificial Intelligence Research and Innovation Lab.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map(({ href, title, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-700 hover:shadow-pop"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon size={22} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
            <p className="mt-1 flex-1 text-sm text-ink-soft">{desc}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}