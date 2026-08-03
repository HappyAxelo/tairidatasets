"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

function LoginInner() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      router.push(params.get("next") || "/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-6 py-20">
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-ink-faint">Access your TAIRI DataHub account</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <Label>Email address</Label>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@ur.ac.rw"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Password</Label>
            <Link href="/forgot-password" className="mb-1.5 text-xs text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-faint">
        No account?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:underline">
          Create one
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4 text-xs text-ink-faint">
        <p className="font-medium text-ink-soft">Demo accounts</p>
        <p className="mt-1">Student: aline.uwase@student.ur.ac.rw · Student#2026</p>
        <p>Researcher: researcher@ur.ac.rw · Researcher#2026</p>
        <p>Admin: admin1@tairi.ur.ac.rw · ChangeMe#2026</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
