"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    affiliation: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", form, { auth: false });
      setDone(true);
      // Auto sign-in for convenience (email verification remains available).
      try {
        await login(form.email, form.password);
        setTimeout(() => router.push("/dashboard"), 1200);
      } catch {
        /* ignore, user can log in manually */
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (done)
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
        <h1 className="mt-4 text-xl font-bold">Account created</h1>
        <p className="mt-2 text-sm text-ink-faint">
          A verification email has been sent. Redirecting you to your dashboard...
        </p>
      </div>
    );

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Register as a researcher to browse and request access to datasets.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <Label>Full name</Label>
          <Input required value={form.full_name} onChange={set("full_name")} placeholder="Jane Mukamana" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Username</Label>
            <Input required value={form.username} onChange={set("username")} placeholder="jane.m" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" required value={form.email} onChange={set("email")} placeholder="you@ur.ac.rw" />
          </div>
        </div>
        <div>
          <Label>Affiliation</Label>
          <Input value={form.affiliation} onChange={set("affiliation")} placeholder="University of Rwanda" />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set("password")}
            placeholder="At least 8 characters"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-faint">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
