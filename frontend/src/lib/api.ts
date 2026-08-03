// Lightweight typed API client with automatic token refresh.
// All requests go to same-origin /api/* (proxied to FastAPI by Next rewrites
// in dev and by Nginx in production).

import type { Tokens } from "./types";

const ACCESS_KEY = "tairi_access";
const REFRESH_KEY = "tairi_refresh";

export const tokenStore = {
  get access() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  set(tokens: Tokens) {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const BASE = "/api/v1";

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) {
    tokenStore.clear();
    return false;
  }
  tokenStore.set(await res.json());
  return true;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  raw?: boolean; // send FormData / non-JSON as-is
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, raw = false, body, headers, ...rest } = options;

  const buildHeaders = (): HeadersInit => {
    const h: Record<string, string> = { ...(headers as Record<string, string>) };
    if (!raw && body !== undefined) h["Content-Type"] = "application/json";
    if (auth && tokenStore.access) h["Authorization"] = `Bearer ${tokenStore.access}`;
    return h;
  };

  const doFetch = () =>
    fetch(`${BASE}${path}`, {
      ...rest,
      headers: buildHeaders(),
      body: raw ? (body as BodyInit) : body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  // Attempt a single transparent refresh on 401.
  if (res.status === 401 && auth && tokenStore.refresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await doFetch();
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text();

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && (payload as any).detail) ||
      (typeof payload === "string" && payload) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, Array.isArray(message) ? message[0]?.msg ?? "Invalid input" : message);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { ...opts, method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData, raw: true }),
};
