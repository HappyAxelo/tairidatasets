"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Database, Download, Eye, HardDrive, Inbox, Upload } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { AreaTrend } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader, CardTitle, EmptyState } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AccessRequest, DatasetListItem } from "@/lib/types";
import { humanSize } from "@/lib/utils";

export default function DashboardOverview() {
  const { user, isRole } = useAuth();
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const isUploader = isRole("student_researcher", "super_admin");

  useEffect(() => {
    if (isUploader) {
      api.get<DatasetListItem[]>("/datasets/mine").then(setDatasets).catch(() => {});
      api.get<AccessRequest[]>("/access-requests/incoming").then(setRequests).catch(() => {});
    } else {
      api.get<AccessRequest[]>("/access-requests/outgoing").then(setRequests).catch(() => {});
    }
  }, [isUploader]);

  const totals = useMemo(() => {
    const downloads = datasets.reduce((a, d) => a + d.download_count, 0);
    const views = datasets.reduce((a, d) => a + d.view_count, 0);
    const storage = datasets.reduce((a, d) => a + d.total_size_bytes, 0);
    const pending = requests.filter((r) => r.status === "pending").length;
    return { downloads, views, storage, pending };
  }, [datasets, requests]);

  const trend = useMemo(
    () =>
      datasets
        .slice(0, 8)
        .map((d) => ({ label: d.title.slice(0, 8), value: d.download_count }))
        .reverse(),
    [datasets]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.full_name?.split(" ")[0] || user?.username}
          </h1>
          <p className="mt-1 text-sm text-ink-faint">
            {isUploader ? "Here's how your datasets are performing." : "Track your dataset access requests."}
          </p>
        </div>
        {isUploader && (
          <Link href="/dashboard/upload">
            <Button>
              <Upload size={16} /> Upload dataset
            </Button>
          </Link>
        )}
      </div>

      {isUploader ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Database size={16} />} label="Datasets" value={datasets.length} />
            <StatCard icon={<Download size={16} />} label="Total downloads" value={totals.downloads} />
            <StatCard icon={<Eye size={16} />} label="Total views" value={totals.views} />
            <StatCard icon={<HardDrive size={16} />} label="Storage used" value={humanSize(totals.storage)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Downloads by dataset</CardTitle>
              </CardHeader>
              <CardBody>
                {trend.length > 0 ? (
                  <AreaTrend data={trend} />
                ) : (
                  <p className="py-12 text-center text-sm text-ink-faint">
                    Upload a dataset to see analytics.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Pending requests</CardTitle>
                {totals.pending > 0 && <Badge tone="warning">{totals.pending}</Badge>}
              </CardHeader>
              <CardBody className="space-y-3">
                {requests.filter((r) => r.status === "pending").slice(0, 5).length === 0 ? (
                  <p className="py-8 text-center text-sm text-ink-faint">No pending requests</p>
                ) : (
                  requests
                    .filter((r) => r.status === "pending")
                    .slice(0, 5)
                    .map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{r.requester.full_name || r.requester.username}</span>
                        <Link href="/dashboard/requests">
                          <Button size="sm" variant="ghost">
                            Review
                          </Button>
                        </Link>
                      </div>
                    ))
                )}
              </CardBody>
            </Card>
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Inbox size={16} />} label="My requests" value={requests.length} />
          <StatCard
            icon={<Download size={16} />}
            label="Approved"
            value={requests.filter((r) => r.status === "approved").length}
          />
          <StatCard
            icon={<Eye size={16} />}
            label="Pending"
            value={requests.filter((r) => r.status === "pending").length}
          />
        </div>
      )}

      {isUploader && datasets.length === 0 && (
        <EmptyState
          icon={<Database size={28} />}
          title="No datasets yet"
          description="Publish your first research dataset to get started."
          action={
            <Link href="/dashboard/upload">
              <Button>Upload dataset</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
