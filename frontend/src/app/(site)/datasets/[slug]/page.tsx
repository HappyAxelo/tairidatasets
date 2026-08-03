"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import {
  BookText,
  Building2,
  Calendar,
  Download,
  FileText,
  Heart,
  Lock,
  Mail,
  ShieldCheck,
  Tag as TagIcon,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, CardBody, EmptyState, Spinner } from "@/components/ui/primitives";
import { VisibilityBadge } from "@/components/visibility-badge";
import { CitationBox } from "@/components/citation-box";
import { RequestAccessModal } from "@/components/request-access-modal";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { DatasetDetail } from "@/lib/types";
import { fileExtension, formatNumber, humanSize } from "@/lib/utils";

const TABS = ["Overview", "Files", "Versions", "Citation"] as const;
type Tab = (typeof TABS)[number];

export default function DatasetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [dataset, setDataset] = useState<DatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Overview");
  const [requestOpen, setRequestOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api
      .get<DatasetDetail>(`/datasets/${slug}`, { auth: false })
      .then(setDataset)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Not found"))
      .finally(() => setLoading(false));
  };
  useEffect(load, [slug]);

  const currentVersion = useMemo(
    () => dataset?.versions.find((v) => v.is_current) ?? dataset?.versions[0],
    [dataset]
  );

  const canDownload =
    dataset &&
    (dataset.visibility === "public" ||
      (user && (user.id === dataset.owner.id || user.role.name === "super_admin")));

  const isOwner = user && dataset && user.id === dataset.owner.id;

  const download = async (fileId: number, filename: string) => {
    if (!user) {
      router.push(`/login?next=/datasets/${slug}`);
      return;
    }
    try {
      const res = await fetch(`/api/v1/datasets/${dataset!.id}/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("tairi_access")}` },
      });
      if (res.status === 403) {
        setRequestOpen(true);
        return;
      }
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      load();
    } catch {
      const { toast } = await import("sonner");
      toast.error("Download failed");
    }
  };

  const toggleFavorite = async () => {
    if (!user) return router.push("/login");
    await api.post(`/datasets/${dataset!.id}/favorite`);
    load();
  };

  if (loading)
    return (
      <div className="flex justify-center py-32 text-brand-500">
        <Spinner className="h-7 w-7" />
      </div>
    );

  if (error || !dataset)
    return (
      <div className="container-tight py-20">
        <EmptyState
          icon={<Lock size={28} />}
          title={error ?? "Dataset not available"}
          description="This dataset may be private or does not exist."
          action={
            <Link href="/datasets">
              <Button variant="outline">Browse datasets</Button>
            </Link>
          }
        />
      </div>
    );

  return (
    <>
      {/* Banner */}
      <div className="border-b border-border bg-gradient-to-b from-brand-50/70 to-white">
        <div className="container-tight py-8">
          <div className="flex flex-wrap items-center gap-2">
            <VisibilityBadge visibility={dataset.visibility} />
            {dataset.research_area && <Badge tone="brand">{dataset.research_area.name}</Badge>}
            {dataset.category && <Badge tone="neutral">{dataset.category.name}</Badge>}
            {dataset.status !== "approved" && (
              <Badge tone="warning">
                {dataset.status.replace("_", " ")}
              </Badge>
            )}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight"
          >
            {dataset.title}
          </motion.h1>

          {dataset.authors && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-soft">
              <User size={14} /> {dataset.authors}
            </p>
          )}
          {dataset.affiliation && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-faint">
              <Building2 size={14} /> {dataset.affiliation}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-6 text-sm text-ink-soft">
            <Stat icon={<Download size={15} />} value={formatNumber(dataset.download_count)} label="downloads" />
            <Stat icon={<FileText size={15} />} value={String(dataset.file_count)} label="files" />
            <Stat icon={<Heart size={15} />} value={formatNumber(dataset.like_count)} label="likes" />
            <Stat icon={<Calendar size={15} />} value={new Date(dataset.created_at).toLocaleDateString()} label="" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container-tight grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Tabs */}
          <div className="mb-6 flex gap-1 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-4 py-2.5 text-sm font-medium transition ${
                  tab === t ? "text-brand-700" : "text-ink-faint hover:text-ink"
                }`}
              >
                {t}
                {tab === t && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600"
                  />
                )}
              </button>
            ))}
          </div>

          {tab === "Overview" && (
            <div className="space-y-8">
              {dataset.description && (
                <section>
                  <h2 className="mb-2 text-base font-semibold">Description</h2>
                  <p className="text-sm leading-relaxed text-ink-soft">{dataset.description}</p>
                </section>
              )}
              {dataset.keywords && (
                <section>
                  <h2 className="mb-2 text-base font-semibold">Keywords</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {dataset.keywords.split(",").map((k) => (
                      <Badge key={k} tone="outline">
                        <TagIcon size={11} /> {k.trim()}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}
              {dataset.readme && (
                <section>
                  <h2 className="mb-2 flex items-center gap-1.5 text-base font-semibold">
                    <BookText size={16} /> README
                  </h2>
                  <div className="prose-readme rounded-lg border border-border bg-card p-5">
                    <Markdown remarkPlugins={[remarkGfm]}>{dataset.readme}</Markdown>
                  </div>
                </section>
              )}
            </div>
          )}

          {tab === "Files" && (
            <div className="space-y-2">
              {!currentVersion || currentVersion.files.length === 0 ? (
                <EmptyState icon={<FileText size={26} />} title="No files uploaded yet" />
              ) : (
                currentVersion.files.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-muted text-[0.6rem] font-bold uppercase text-ink-soft">
                        {fileExtension(f.filename) || "file"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{f.filename}</p>
                        <p className="text-xs text-ink-faint">
                          {humanSize(f.size_bytes)}
                          {f.checksum_sha256 && ` · sha256:${f.checksum_sha256.slice(0, 10)}…`}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => download(f.id, f.filename)}>
                      <Download size={14} /> Download
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "Versions" && (
            <div className="space-y-3">
              {dataset.versions.map((v) => (
                <div key={v.id} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      v{v.version}
                      {v.is_current && <Badge tone="success">current</Badge>}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {new Date(v.created_at).toLocaleDateString()} · {humanSize(v.total_size_bytes)}
                    </span>
                  </div>
                  {v.changelog && <p className="mt-1.5 text-sm text-ink-soft">{v.changelog}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === "Citation" && (
            <div className="space-y-4">
              <p className="text-sm text-ink-soft">
                If you use this dataset in your research, please cite it as follows:
              </p>
              <CitationBox slug={dataset.slug} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardBody className="space-y-3">
              {canDownload ? (
                <div className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <ShieldCheck size={14} className="mr-1 inline" /> You have access to download this dataset.
                </div>
              ) : (
                <Button className="w-full" onClick={() => (user ? setRequestOpen(true) : router.push("/login"))}>
                  <Lock size={15} /> Request access
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={toggleFavorite}>
                <Heart size={15} /> Favorite
              </Button>
              {isOwner && (
                <Link href={`/dashboard/datasets`} className="block">
                  <Button variant="subtle" className="w-full">
                    Manage dataset
                  </Button>
                </Link>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint">Details</h3>
              <Meta label="Owner">
                <span className="flex items-center gap-1.5">
                  <Avatar name={dataset.owner.full_name || dataset.owner.username} size={20} />
                  {dataset.owner.full_name || dataset.owner.username}
                </span>
              </Meta>
              {dataset.license && <Meta label="License">{dataset.license.name}</Meta>}
              {dataset.department && <Meta label="Department">{dataset.department.name}</Meta>}
              {dataset.doi && <Meta label="DOI">{dataset.doi}</Meta>}
              {dataset.funding_agency && <Meta label="Funding">{dataset.funding_agency}</Meta>}
              {dataset.contact_email && (
                <Meta label="Contact">
                  <a href={`mailto:${dataset.contact_email}`} className="flex items-center gap-1 text-brand-600">
                    <Mail size={13} /> Email
                  </a>
                </Meta>
              )}
              <Meta label="Size">{humanSize(dataset.total_size_bytes)}</Meta>
              <Meta label="Updated">{new Date(dataset.updated_at).toLocaleDateString()}</Meta>
            </CardBody>
          </Card>

          {dataset.tags.length > 0 && (
            <Card>
              <CardBody>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {dataset.tags.map((t) => (
                    <Link key={t.id} href={`/datasets?q=${t.name}`}>
                      <Badge tone="neutral">{t.name}</Badge>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </aside>
      </div>

      <RequestAccessModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        datasetId={dataset.id}
        onSubmitted={load}
      />
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-brand-600">{icon}</span>
      <span className="font-semibold text-ink">{value}</span>
      {label && <span className="text-ink-faint">{label}</span>}
    </span>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-ink-faint">{label}</span>
      <span className="text-right font-medium text-ink">{children}</span>
    </div>
  );
}
