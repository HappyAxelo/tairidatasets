import { Globe, Lock, ShieldCheck, Eye } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import type { Visibility } from "@/lib/types";

const MAP: Record<Visibility, { label: string; tone: any; icon: React.ReactNode }> = {
  public: { label: "Public", tone: "success", icon: <Globe size={11} /> },
  public_metadata: { label: "Public metadata", tone: "brand", icon: <Eye size={11} /> },
  restricted: { label: "Restricted", tone: "warning", icon: <ShieldCheck size={11} /> },
  private: { label: "Private", tone: "neutral", icon: <Lock size={11} /> },
};

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const v = MAP[visibility] ?? MAP.private;
  return (
    <Badge tone={v.tone}>
      {v.icon} {v.label}
    </Badge>
  );
}
