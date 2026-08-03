"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Styles = { apa: string; ieee: string; bibtex: string };
const TABS: { key: keyof Styles; label: string }[] = [
  { key: "apa", label: "APA" },
  { key: "ieee", label: "IEEE" },
  { key: "bibtex", label: "BibTeX" },
];

export function CitationBox({ slug }: { slug: string }) {
  const [styles, setStyles] = useState<Styles | null>(null);
  const [active, setActive] = useState<keyof Styles>("apa");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<Styles>(`/citations/${slug}`, { auth: false }).then(setStyles).catch(() => {});
  }, [slug]);

  const copy = async () => {
    if (!styles) return;
    await navigator.clipboard.writeText(styles[active]);
    setCopied(true);
    toast.success("Citation copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                active === t.key ? "bg-brand-50 text-brand-700" : "text-ink-faint hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />} Copy
          </Button>
          <a href={`/api/v1/citations/${slug}/bibtex`} download>
            <Button variant="ghost" size="sm">
              <Download size={14} /> .bib
            </Button>
          </a>
        </div>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-xs leading-relaxed text-ink-soft">
        {styles ? styles[active] : "Loading citation..."}
      </pre>
    </div>
  );
}
