"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

function VerifyEmailInner() {
  const token = useSearchParams().get("token") || "";
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "This link is missing its verification token.");
  const sent = useRef(false);

  useEffect(() => {
    // Guard against React strict mode running the effect twice (token is single-use).
    if (!token || sent.current) return;
    sent.current = true;
    api
      .post("/auth/verify-email", { token }, { auth: false })
      .then(() => setState("ok"))
      .catch((err) => {
        setState("error");
        setMessage(err instanceof ApiError ? err.message : "Verification failed");
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      {state === "loading" && <p className="text-sm text-ink-faint">Verifying your email...</p>}
      {state === "ok" && (
        <>
          <h1 className="text-xl font-bold">Email verified</h1>
          <p className="mt-2 text-sm text-ink-faint">Your account is active. You can now sign in.</p>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="text-xl font-bold">Verification failed</h1>
          <p className="mt-2 text-sm text-ink-faint">{message}</p>
        </>
      )}
      {state !== "loading" && (
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:underline">
          Go to sign in
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
