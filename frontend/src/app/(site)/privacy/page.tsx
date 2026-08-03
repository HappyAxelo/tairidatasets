import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="container-tight max-w-3xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-faint">Last updated: {new Date().getFullYear()}</p>
      <div className="prose-readme mt-8 space-y-4">
        <p>
          TAIRI DataHub is operated by the TAIRI Lab at the University of Rwanda. This policy explains
          what data we collect and how it is used.
        </p>
        <h2>Information we collect</h2>
        <p>
          We collect account information (name, email, affiliation), dataset metadata you provide, and
          usage data such as views, downloads and access requests required to operate the platform.
        </p>
        <h2>How we use data</h2>
        <p>
          Data is used solely to provide the repository service: authentication, access control,
          notifications, citation generation and platform analytics for administrators. We do not sell
          personal data.
        </p>
        <h2>Data governance</h2>
        <p>
          The platform is self-hosted on University of Rwanda infrastructure. Access to restricted
          datasets is controlled by dataset owners through explicit approval workflows, and all
          administrative actions are recorded in an audit log.
        </p>
        <h2>Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data by contacting
          tairi@ur.ac.rw.
        </p>
      </div>
    </div>
  );
}
