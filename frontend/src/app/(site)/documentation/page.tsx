import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Code2, Download, Upload, UserPlus } from "lucide-react";

export const metadata: Metadata = { title: "Documentation" };

const SECTIONS = [
  {
    icon: <UserPlus size={20} />,
    title: "Getting started",
    steps: [
      "Create a researcher account or sign in with credentials issued by your administrator.",
      "Verify your email address using the link sent to your inbox.",
      "Browse datasets by domain, or search by title, author, keyword or file type.",
    ],
  },
  {
    icon: <Download size={20} />,
    title: "Requesting access",
    steps: [
      "Open a dataset and click Request access.",
      "Describe your research purpose, institution and area of study.",
      "The dataset owner reviews your request; you are notified by email of the decision.",
      "Once approved, download files directly or via the API.",
    ],
  },
  {
    icon: <Upload size={20} />,
    title: "Uploading datasets",
    steps: [
      "Student researchers and administrators can upload datasets.",
      "Provide metadata: title, description, authors, license and research area.",
      "Drag and drop files of any type — CSV, images, audio, notebooks and more.",
      "Each upload is versioned automatically (1.0, 1.1, 2.0 ...).",
    ],
  },
  {
    icon: <Code2 size={20} />,
    title: "API reference",
    steps: [
      "The platform exposes a fully documented REST API.",
      "Interactive Swagger docs are available at /docs on the API server.",
      "Authenticate with a JWT bearer token from the /auth/login endpoint.",
    ],
  },
];

export default function DocumentationPage() {
  return (
    <div className="container-tight py-16">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600">
          <BookOpen size={16} /> Documentation
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">User guide</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Everything you need to browse, request, upload and cite datasets on TAIRI DataHub.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {s.icon}
              </span>
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <ol className="mt-4 space-y-2.5">
              {s.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink-soft">
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-100 text-[0.7rem] font-semibold text-brand-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-brand-200 bg-brand-50/60 p-6">
        <p className="text-sm text-ink-soft">
          For full installation, deployment and administrator guides, see the{" "}
          <Link href="https://github.com/HappyAxelo/tairidatasets" className="font-medium text-brand-600 hover:underline">
            project repository
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
