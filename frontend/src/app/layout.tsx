import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TAIRI DataHub: A Trusted Repository for AI Research Datasets",
    template: "%s · TAIRI DataHub",
  },
  description:
    "TAIRI DataHub is a secure repository for AI research datasets at the University of Rwanda. Upload, share, cite and request access to research datasets.",
  keywords: ["datasets", "research", "AI", "University of Rwanda", "TAIRI", "open science"],
  authors: [{ name: "TAIRI Lab, University of Rwanda" }],
  openGraph: {
    title: "TAIRI DataHub",
    description: "A Trusted Repository for AI Research Datasets TAIRI Lab, University of Rwanda.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
