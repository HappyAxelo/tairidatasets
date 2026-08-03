import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div className="container-tight max-w-3xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
      <p className="mt-2 text-sm text-ink-faint">Last updated: {new Date().getFullYear()}</p>
      <div className="prose-readme mt-8 space-y-4">
        <h2>Acceptable use</h2>
        <p>
          TAIRI DataHub is provided for legitimate research and educational purposes. You agree to use
          datasets in accordance with their stated licenses and any conditions set by the dataset owner
          during the access-request process.
        </p>
        <h2>Dataset ownership</h2>
        <p>
          Uploaders retain ownership of and responsibility for the datasets they publish, including
          ensuring they have the right to share the data and that appropriate consent and ethical
          approvals are in place.
        </p>
        <h2>Attribution</h2>
        <p>
          When you use a dataset in published work, you must cite it using the citation provided on the
          dataset page.
        </p>
        <h2>Prohibited conduct</h2>
        <p>
          You may not attempt to circumvent access controls, redistribute restricted datasets, or use
          the platform to store unlawful content.
        </p>
        <h2>Availability</h2>
        <p>
          The platform is provided on an "as is" basis. The TAIRI Lab may update these terms as the
          service evolves.
        </p>
      </div>
    </div>
  );
}
