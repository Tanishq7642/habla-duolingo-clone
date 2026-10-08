import type { NextConfig } from "next";

// The browser always talks to same-origin /api; Next proxies to FastAPI.
// No CORS in the hot path, and the backend URL is a server-side concern.
const API_ORIGIN = process.env.HABLA_API_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server (server.js + minimal node_modules) for the Docker image.
  // Vercel ignores this setting, so both deployment paths keep working.
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
