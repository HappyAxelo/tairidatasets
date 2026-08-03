import Link from "next/link";
import { motion } from "framer-motion";
import { Database, Download, Eye, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { VisibilityBadge } from "./visibility-badge";
import type { DatasetListItem } from "@/lib/types";
import { formatNumber, humanSize } from "@/lib/utils";

export function DatasetCard({ dataset, index = 0 }: { dataset: DatasetListItem; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        href={`/datasets/${dataset.slug}`}
        className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-card transition hover:border-brand-300 hover:shadow-pop"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            <Database size={17} />
          </span>
          <VisibilityBadge visibility={dataset.visibility} />
        </div>

        <h3 className="line-clamp-2 text-[0.98rem] font-semibold leading-snug text-ink group-hover:text-brand-700">
          {dataset.title}
        </h3>
        {dataset.authors && (
          <p className="mt-1 line-clamp-1 text-xs text-ink-faint">{dataset.authors}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {dataset.research_area && <Badge tone="brand">{dataset.research_area.name}</Badge>}
          {dataset.tags.slice(0, 2).map((t) => (
            <Badge key={t.id} tone="neutral">
              {t.name}
            </Badge>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <Download size={13} /> {formatNumber(dataset.download_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={13} /> {formatNumber(dataset.view_count)}
          </span>
          <span className="inline-flex items-center gap-1">
            <HardDrive size={13} /> {humanSize(dataset.total_size_bytes)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
