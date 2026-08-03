"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email }, { auth: false });
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      {sent ? (
        <div className="text-center">
          <MailCheck size={44} className="mx-auto text-brand-500" />
          <h1 className="mt-4 text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-ink-faint">
            If an account exists for <b>{email}</b>, we've sent a password reset link.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-faint">
            Enter your email and we'll send you a reset link.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <Label>Email address</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
          <Link href="/login" className="mt-6 inline-block text-sm text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </>
      )}
    </div>
  );
}
