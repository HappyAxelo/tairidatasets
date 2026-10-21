"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Cpu,
  Database,
  Download,
  Leaf,
  Microscope,
  Radar,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatasetCard } from "@/components/dataset-card";
import { api } from "@/lib/api";
import type { DatasetListItem, Page } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

// Colours are matched to the UR, ACEIoT and TAIRI logos.
// Full class names are written out so Tailwind keeps them at build time.
const DOMAINS = [
  {
    label: "Artificial Intelligence", // green
    icon: Brain,
    card: "bg-[#EAF6EC] border-[#BFE3C7] hover:border-[#2E9B4E]",
    chip: "bg-[#2E9B4E] text-white",
  },
  {
    label: "Machine Learning", // light green
    icon: Cpu,
    card: "bg-[#F3F9E6] border-[#D5E8A8] hover:border-[#8CC63F]",
    chip: "bg-[#8CC63F] text-white",
  },
  {
    label: "Healthcare", // blue
    icon: Microscope,
    card: "bg-[#E8EFF8] border-[#BCCDE6] hover:border-[#1B4F8A]",
    chip: "bg-[#1B4F8A] text-white",
  },
  {
    label: "Agriculture", // light blue
    icon: Leaf,
    card: "bg-[#E6F5FB] border-[#B3E0F3] hover:border-[#29A3DC]",
    chip: "bg-[#29A3DC] text-white",
  },
  {
    label: "IoT & Sensors", // yellow
    icon: Radar,
    card: "bg-[#FFF6D6] border-[#F5E19A] hover:border-[#F5B800]",
    chip: "bg-[#F5B800] text-slate-900",
  },
  {
    label: "Computer Vision", // light yellow
    icon: Sparkles,
    card: "bg-[#FFFBEA] border-[#F9EBB0] hover:border-[#FBD85D]",
    chip: "bg-[#FBD85D] text-slate-900",
  },
  {
    label: "Cybersecurity", // beige
    icon: Shield,
    card: "bg-[#F7F2EA] border-[#E3D8C6] hover:border-[#C9B79C]",
    chip: "bg-[#C9B79C] text-slate-900",
  },
  {
    label: "Remote Sensing", // deep teal
    icon: Database,
    card: "bg-[#E4F2EF] border-[#B5D9D2] hover:border-[#0B6E5E]",
    chip: "bg-[#0B6E5E] text-white",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState<DatasetListItem[]>([]);
  const [latest, setLatest] = useState<DatasetListItem[]>([]);
  const [stats, setStats] = useState({ datasets: 0, downloads: 0, domains: 16 });

  useEffect(() => {
    api
      .get<Page<DatasetListItem>>("/datasets?sort=downloads&page_size=3", { auth: false })
      .then((p) => {
        setFeatured(p.items);
        setStats((s) => ({
          ...s,
          datasets: p.total,
          downloads: p.items.reduce((a, d) => a + d.download_count, 0),
        }));
      })
      .catch(() => {});
    api
      .get<Page<DatasetListItem>>("/datasets?sort=newest&page_size=6", { auth: false })
      .then((p) => setLatest(p.items))
      .catch(() => {});
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/datasets?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      {/* Hero with background photo */}
      <section
        className="relative overflow-hidden border-b border-border bg-cover bg-center"
        style={{ backgroundImage: "url('/hero.jpg')" }}
      >
        {/* Dark blue overlay so the text stays readable on the photo */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(0,35,80,0.92) 0%, rgba(0,35,80,0.78) 45%, rgba(0,35,80,0.35) 100%)",
          }}
        />
        <div className="container-tight relative py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-200" />
              TAIRI Lab · University of Rwanda
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl">
              A trusted repository for{" "}
              <span className="text-brand-200">AI research datasets</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">
              Discover, share, cite and manage research datasets across every domain from
              agriculture and healthcare to computer vision and climate science. Secure,
              citable and built for the research community.
            </p>

            <form onSubmit={submit} className="mt-8 flex max-w-xl gap-2">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for datasets, e.g. rice disease, speech, air quality..."
                  className="input-base h-12 bg-white pl-11 text-base text-ink"
                />
              </div>
              <Button size="lg" type="submit">
                Search
              </Button>
            </form>

            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              <Stat light value={`${formatNumber(stats.datasets)}+`} label="Datasets" />
              <Stat light value={`${formatNumber(stats.downloads)}+`} label="Downloads" />
              <Stat light value="16" label="Research domains" />
              <Stat light value="4" label="Colleges" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Research domains */}
      <section className="container-tight py-16">
        <SectionHeading
          title="Explore by research domain"
          subtitle="Datasets spanning the University of Rwanda's core research areas"
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {DOMAINS.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
              >
                <Link
                  href={`/datasets?q=${encodeURIComponent(d.label)}`}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium text-ink shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${d.card}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${d.chip}`}
                  >
                    <Icon size={18} />
                  </span>
                  {d.label}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container-tight py-8">
          <div className="flex items-end justify-between">
            <SectionHeading title="Featured datasets" subtitle="Most downloaded on the platform" />
            <Link href="/datasets?sort=downloads" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                View all <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((d, i) => (
              <DatasetCard key={d.id} dataset={d} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Latest */}
      {latest.length > 0 && (
        <section className="container-tight py-12">
          <SectionHeading title="Latest uploads" subtitle="Recently published research data" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((d, i) => (
              <DatasetCard key={d.id} dataset={d} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Feature highlights */}
      <section className="border-y border-border bg-muted/40 py-16">
        <div className="container-tight grid gap-6 md:grid-cols-3">
          <Feature
            icon={<Shield size={22} />}
            title="Secure & governed"
            text="Granular access control, approval workflows and full audit logging keep sensitive research data protected."
            card="bg-[#F4F8FD] border-[#D3E0F2] hover:border-[#1B4F8A]"
            bar="bg-[#1B4F8A]"
            chip="bg-[#1B4F8A] text-white"
          />
          <Feature
            icon={<Database size={22} />}
            title="Any data type"
            text="CSV, images, audio, video, medical scans, satellite imagery, notebooks: no restrictions on formats."
            card="bg-[#FFFBEB] border-[#F5E4A6] hover:border-[#F5B800]"
            bar="bg-[#F5B800]"
            chip="bg-[#F5B800] text-slate-900"
          />
          <Feature
            icon={<Download size={22} />}
            title="Citable science"
            text="Automatic APA, IEEE and BibTeX citations with DOI-ready metadata for reproducible research."
            card="bg-[#F1F9F4] border-[#C6E5D0] hover:border-[#2E9B4E]"
            bar="bg-[#2E9B4E]"
            chip="bg-[#2E9B4E] text-white"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="container-tight py-20">
        <div className="overflow-hidden rounded-2xl bg-brand-600 px-8 py-14 text-center text-white md:px-16">
          <h2 className="text-2xl font-bold md:text-3xl">Publish your research dataset</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Join TAIRI researchers in making Rwandan and African research data discoverable,
            reusable and impactful.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-brand-700 hover:bg-brand-50"
              >
                Get started
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label, light = false }: { value: string; label: string; light?: boolean }) {
  return (
    <div>
      <p className={light ? "text-2xl font-bold text-white" : "text-2xl font-bold text-ink"}>
        {value}
      </p>
      <p className={light ? "text-sm text-white/70" : "text-sm text-ink-faint"}>{label}</p>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-ink md:text-2xl">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-ink-faint">{subtitle}</p>}
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
  card,
  bar,
  chip,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  card: string;
  bar: string;
  chip: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${card}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${bar}`} />
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm ${chip}`}>
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{text}</p>
    </div>
  );
}
