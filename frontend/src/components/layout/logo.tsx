import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, mono = false }: { className?: string; mono?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-4", className)}>
      {/* 1. University of Rwanda */}
      <a href="https://www.ur.ac.rw" target="_blank" rel="noopener noreferrer">
        <Image
          src="UR_logos-removebg-preview.png"
          alt="University of Rwanda"
          width={120}
          height={40}
          className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105"
        />
      </a>

      <span className={cn("h-8 w-px", mono ? "bg-white/20" : "bg-ink/10")} />

      {/* 2. ACEIoT */}
      <Image
        src="ACEIoT-removebg-preview.png"
        alt="ACEIoT"
        width={120}
        height={40}
        className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105"
      />

      <span className={cn("h-8 w-px", mono ? "bg-white/20" : "bg-ink/10")} />

      {/* 3. TAIRI DataHub */}
      <Link href="/" className="group inline-flex items-center gap-2.5">
        <Image
          src="/TAIRILOGO.png"
          alt=""
          width={45}
          height={32}
          className="h-8 w-8 rounded-md object-contain transition-transform duration-300 group-hover:scale-105"
        />
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
    </div>
  );
}