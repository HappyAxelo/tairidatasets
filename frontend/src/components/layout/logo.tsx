import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold",
          mono ? "bg-white text-brand-700" : "bg-brand-600 text-white"
        )}
        aria-hidden
      >
        TD
      </span>
      <span className="leading-tight">
        <span
          className={cn(
            "block text-[0.95rem] font-semibold tracking-tight",
            mono ? "text-white" : "text-ink"
          )}
        >
          TAIRI DataHub
        </span>
        <span className={cn("block text-[0.68rem]", mono ? "text-brand-100" : "text-ink-faint")}>
          University of Rwanda
        </span>
      </span>
    </Link>
  );
}
