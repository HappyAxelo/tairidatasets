import { cn } from "@/lib/utils";

export function StatCard({
  icon,
  label,
  value,
  hint,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-5 shadow-card", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-faint">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
