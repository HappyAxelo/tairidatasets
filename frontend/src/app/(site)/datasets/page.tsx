"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Spinner, EmptyState } from "@/components/ui/primitives";
import { DatasetCard } from "@/components/dataset-card";
import { api } from "@/lib/api";
import type { DatasetListItem, License, Named, Page } from "@/lib/types";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "downloads", label: "Most downloaded" },
  { value: "views", label: "Most viewed" },
  { value: "alphabetical", label: "Alphabetical" },
];

function BrowseInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [areas, setAreas] = useState<Named[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);

  const [q, setQ] = useState(params.get("q") ?? "");

  const page = Number(params.get("page") ?? "1");
  const sort = params.get("sort") ?? "newest";
  const areaId = params.get("research_area_id") ?? "";
  const licenseId = params.get("license_id") ?? "";
  const fileType = params.get("file_type") ?? "";

  const setParam = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v);
        else next.delete(k);
      });
      if (!("page" in updates)) next.set("page", "1");
      router.push(`/datasets?${next.toString()}`);
    },
    [params, router]
  );

  useEffect(() => {
    api.get<Named[]>("/taxonomy/research-areas", { auth: false }).then(setAreas).catch(() => {});
    api.get<License[]>("/taxonomy/licenses", { auth: false }).then(setLicenses).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (params.get("q")) qs.set("q", params.get("q")!);
    qs.set("sort", sort);
    qs.set("page", String(page));
    qs.set("page_size", "12");
    if (areaId) qs.set("research_area_id", areaId);
    if (licenseId) qs.set("license_id", licenseId);
    if (fileType) qs.set("file_type", fileType);

    api
      .get<Page<DatasetListItem>>(`/datasets?${qs.toString()}`, { auth: false })
      .then((p) => {
        setDatasets(p.items);
        setTotal(p.total);
        setPages(p.pages);
      })
      .finally(() => setLoading(false));
  }, [params, sort, page, areaId, licenseId, fileType]);

  return (
    <div className="container-tight py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Browse datasets</h1>
        <p className="mt-1 text-sm text-ink-faint">
          {total.toLocaleString()} dataset{total === 1 ? "" : "s"} available
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside className="space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam({ q });
            }}
          >
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="input-base h-9 pl-9"
              />
            </div>
          </form>

          <FilterGroup label="Research area">
            <Select value={areaId} onChange={(e) => setParam({ research_area_id: e.target.value })}>
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </FilterGroup>

          <FilterGroup label="License">
            <Select value={licenseId} onChange={(e) => setParam({ license_id: e.target.value })}>
              <option value="">All licenses</option>
              {licenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code}
                </option>
              ))}
            </Select>
          </FilterGroup>

          <FilterGroup label="File type">
            <Select value={fileType} onChange={(e) => setParam({ file_type: e.target.value })}>
              <option value="">Any type</option>
              {["csv", "xlsx", "json", "zip", "pdf", "png", "jpg", "wav", "mp4", "ipynb"].map((t) => (
                <option key={t} value={t}>
                  .{t}
                </option>
              ))}
            </Select>
          </FilterGroup>

          {(areaId || licenseId || fileType || params.get("q")) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/datasets")}
              className="text-ink-faint"
            >
              Clear filters
            </Button>
          )}
        </aside>

        {/* Results */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-faint">
              <SlidersHorizontal size={14} /> Sort
            </span>
            <Select
              value={sort}
              onChange={(e) => setParam({ sort: e.target.value })}
              className="h-9 w-48"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-24 text-brand-500">
              <Spinner className="h-6 w-6" />
            </div>
          ) : datasets.length === 0 ? (
            <EmptyState
              icon={<Filter size={28} />}
              title="No datasets found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {datasets.map((d, i) => (
                  <DatasetCard key={d.id} dataset={d} index={i} />
                ))}
              </div>

              {pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setParam({ page: String(page - 1) })}
                  >
                    Previous
                  </Button>
                  <span className="px-3 text-sm text-ink-faint">
                    Page {page} of {pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pages}
                    onClick={() => setParam({ page: String(page + 1) })}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      {children}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="container-tight py-24 text-center text-ink-faint">Loading…</div>}>
      <BrowseInner />
    </Suspense>
  );
}
