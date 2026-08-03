"use client";

import { useEffect, useState } from "react";
import { Clock, Database, Download, FileClock, HardDrive, Users } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { AreaTrend, BarRank, DonutBreakdown } from "@/components/charts";
import { Card, CardBody, CardHeader, CardTitle, Spinner } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import type { AdminOverview } from "@/lib/types";
import { humanSize } from "@/lib/utils";

export default function AdminAnalytics() {
  const [data, setData] = useState<AdminOverview | null>(null);

  useEffect(() => {
    api.get<AdminOverview>("/admin/overview").then(setData).catch(() => {});
  }, []);

  if (!data)
    return <div className="flex justify-center py-24 text-brand-500"><Spinner className="h-6 w-6" /></div>;

  const { cards } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform analytics</h1>
        <p className="mt-1 text-sm text-ink-faint">Overview of activity across TAIRI DataHub.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={<Database size={16} />} label="Datasets" value={cards.datasets} />
        <StatCard icon={<Users size={16} />} label="Users" value={cards.users} />
        <StatCard icon={<Download size={16} />} label="Downloads" value={cards.downloads} />
        <StatCard icon={<HardDrive size={16} />} label="Storage" value={humanSize(cards.storage_bytes)} />
        <StatCard icon={<Clock size={16} />} label="Pending requests" value={cards.pending_requests} />
        <StatCard icon={<FileClock size={16} />} label="Pending datasets" value={cards.pending_datasets} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Monthly uploads</CardTitle></CardHeader>
          <CardBody><AreaTrend data={data.monthly_uploads} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Datasets by research area</CardTitle></CardHeader>
          <CardBody className="flex items-center justify-center"><DonutBreakdown data={data.research_areas} /></CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Most downloaded datasets</CardTitle></CardHeader>
          <CardBody>
            {data.top_datasets.length ? <BarRank data={data.top_datasets} /> : <p className="py-10 text-center text-sm text-ink-faint">No downloads yet</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Storage by research area</CardTitle></CardHeader>
          <CardBody>
            {data.storage_by_area.length ? (
              <BarRank data={data.storage_by_area.map((s) => ({ name: s.name, value: Math.round(s.value / 1024 / 1024) }))} />
            ) : (
              <p className="py-10 text-center text-sm text-ink-faint">No data yet</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
