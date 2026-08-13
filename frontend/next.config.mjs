/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Docker (Render/self-host) needs the slim standalone server; on Vercel use
  // its native build output instead (Vercel sets the VERCEL env var).
  output: process.env.VERCEL ? undefined : "standalone",
  // Lint is run separately in CI; do not fail production builds on lint.
  eslint: { ignoreDuringBuilds: true },
  // Proxy API + WebSocket traffic to the backend in development so the SPA can
  // use same-origin relative URLs. In production Nginx handles this routing.
  async rewrites() {
    const backend = process.env.BACKEND_INTERNAL_URL || "http://localhost:8000";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
    ];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
