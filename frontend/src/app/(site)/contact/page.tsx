import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="container-tight py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Contact TAIRI Lab</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Questions about the platform, a dataset or a partnership? Reach out to the team.
        </p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <Item icon={<Mail size={20} />} title="Email" value="tairi@ur.ac.rw" />
        <Item icon={<Phone size={20} />} title="Phone" value="+250 788 000 000" />
        <Item
          icon={<MapPin size={20} />}
          title="Address"
          value="College of Science and Technology, University of Rwanda, KN 7 Ave, Kigali"
        />
      </div>
    </div>
  );
}

function Item({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider text-ink-faint">{title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{value}</p>
    </div>
  );
}
