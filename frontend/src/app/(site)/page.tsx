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

const DOMAINS = [
  { icon: <Brain size={20} />, label: "Artificial Intelligence" },
  { icon: <Cpu size={20} />, label: "Machine Learning" },
  { icon: <Microscope size={20} />, label: "Healthcare" },
  { icon: <Leaf size={20} />, label: "Agriculture" },
  { icon: <Radar size={20} />, label: "IoT & Sensors" },
  { icon: <Sparkles size={20} />, label: "Computer Vision" },
  { icon: <Shield size={20} />, label: "Cybersecurity" },
  { icon: <Database size={20} />, label: "Remote Sensing" },
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
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand-50/60 to-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(0,86,166,0.12) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="container-tight relative py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              TAIRI Lab · University of Rwanda
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
              A trusted repository for{" "}
              <span className="text-brand-600">AI research datasets</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              Discover, share, cite and manage research datasets across every domain — from
              agriculture and healthcare to computer vision and climate science. Secure,
              citable and built for the research community.
            </p>

            <form onSubmit={submit} className="mt-8 flex max-w-xl gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search for datasets, e.g. rice disease, speech, air quality..."
                  className="input-base h-12 pl-11 text-base"
                />
              </div>
              <Button size="lg" type="submit">
                Search
              </Button>
            </form>

            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              <Stat value={`${formatNumber(stats.datasets)}+`} label="Datasets" />
              <Stat value={`${formatNumber(stats.downloads)}+`} label="Downloads" />
              <Stat value="16" label="Research domains" />
              <Stat value="4" label="Colleges" />
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
          {DOMAINS.map((d, i) => (
            <motion.div
              key={d.label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <Link
                href={`/datasets?q=${encodeURIComponent(d.label)}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 text-sm font-medium text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
              >
                <span className="text-brand-600">{d.icon}</span>
                {d.label}
              </Link>
            </motion.div>
          ))}
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
        <div className="container-tight grid gap-8 md:grid-cols-3">
          <Feature
            icon={<Shield size={22} />}
            title="Secure & governed"
            text="Granular access control, approval workflows and full audit logging keep sensitive research data protected."
          />
          <Feature
            icon={<Database size={22} />}
            title="Any data type"
            text="CSV, images, audio, video, medical scans, satellite imagery, notebooks — no restrictions on formats."
          />
          <Feature
            icon={<Download size={22} />}
            title="Citable science"
            text="Automatic APA, IEEE and BibTeX citations with DOI-ready metadata for reproducible research."
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
              <Button size="lg" variant="secondary" className="bg-white text-brand-700 hover:bg-brand-50">
                Get started
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-ink-faint">{label}</p>
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

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div>
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{text}</p>
    </div>
  );
}
