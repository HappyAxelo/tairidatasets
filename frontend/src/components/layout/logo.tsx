import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** UR + ACEIoT, for the left side of the header */
export function PartnerLogos({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-5", className)}>
      <a href="https://www.ur.ac.rw" target="_blank" rel="noopener noreferrer">
        <Image
          src="/URLOGO.png"
          alt="University of Rwanda"
          width={200}
          height={80}
          className="h-14 w-auto object-contain transition-transform duration-300 hover:scale-105 sm:h-16"
        />
      </a>
      <span className={cn("h-10 w-px", mono ? "bg-white/20" : "bg-ink/10")} />
      <Image
        src="/ACEIOT.png"
        alt="ACEIoT"
        width={200}
        height={80}
        className="h-14 w-auto object-contain transition-transform duration-300 hover:scale-105 sm:h-16"
      />
    </div>
  );
}

/** TAIRI DataHub, for the right corner of the header */
export function TairiLogo({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)}>
      <Image
        src="/TAIRILOGO.png"
        alt="TAIRI"
        width={160}
        height={80}
        className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105 sm:h-16"
      />
      <span className="hidden leading-tight xl:block">
        <span
          className={cn(
            "block text-base font-semibold tracking-tight",
            mono ? "text-white" : "text-ink"
          )}
        >
          TAIRI DataHub
        </span>
        <span className={cn("block text-xs", mono ? "text-brand-100" : "text-ink-faint")}>
          University of Rwanda
        </span>
      </span>
    </Link>
  );
}

/** All three together (for the footer or other places) */
export function Logo({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-5", className)}>
      <PartnerLogos mono={mono} />
      <span className={cn("h-10 w-px", mono ? "bg-white/20" : "bg-ink/10")} />
      <TairiLogo mono={mono} />
    </div>
  );
}