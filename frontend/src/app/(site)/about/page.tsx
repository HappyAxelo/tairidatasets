import type { Metadata } from "next";
import { Building2, Globe2, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container-tight py-16">
      <div className="max-w-3xl">
        <span className="text-sm font-medium text-brand-600">About the platform</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Advancing trustworthy AI research at the University of Rwanda
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          TAIRI DataHub is the official research dataset repository of the Trustworthy Artificial
          Intelligence Research and Innovation (TAIRI) Lab at the University of Rwanda. It provides a
          secure, governed and citable home for research data across every discipline.
        </p>
        <p className="mt-4 leading-relaxed text-ink-soft">
          The platform is self-hosted on University of Rwanda infrastructure, giving researchers full
          control over sensitive data while enabling open, reproducible science. It is designed to
          scale to thousands of datasets and users, with a modular architecture that supports DOI
          integration, cloud object storage and institutional single sign-on.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <ShieldCheck size={22} />, title: "Governed access", text: "Fine-grained permissions and approval workflows for sensitive data." },
          { icon: <Globe2 size={22} />, title: "Open science", text: "Citable datasets with DOI-ready metadata and standard licenses." },
          { icon: <Users size={22} />, title: "For researchers", text: "Built for students, faculty and collaborators across four colleges." },
          { icon: <Building2 size={22} />, title: "Institutional", text: "Self-hosted and branded for the University of Rwanda." },
        ].map((f) => (
          <div key={f.title} className="rounded-lg border border-border bg-card p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              {f.icon}
            </div>
            <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-ink-soft">{f.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-xl border border-border bg-muted/40 p-8">
        <h2 className="text-xl font-semibold">Our mission</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
          To accelerate high-impact, ethical AI research in Rwanda and across Africa by making
          research data discoverable, reusable and trustworthy — while respecting the privacy and
          governance requirements of the data it holds.
        </p>
      </div>
    </div>
  );
}
