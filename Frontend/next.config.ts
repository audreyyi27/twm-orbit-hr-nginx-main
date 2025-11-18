import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE:
      process.env.NEXT_PUBLIC_API_BASE || "/api",
  },
  // Rewrites for client-side requests (browser fetch)
  // Server-side requests use ssr-api.ts which routes directly to backend
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    console.log(`[next.config] Setting up rewrites with backend: ${backendUrl}`);
    
    return [
      // IMPORTANT: More specific routes must come BEFORE the catch-all
      // Next.js processes rewrites in order and stops at first match
      {
        // Keep specific Next.js API routes (cookie management only)
        // These are Next.js API routes that handle cookies
        source: "/api/auth/set-cookies",
        destination: "/api/auth/set-cookies",
      },
      {
        source: "/api/auth/clear-cookies",
        destination: "/api/auth/clear-cookies",
      },
      {
        source: "/api/auth/get-token",
        destination: "/api/auth/get-token",
      },
      {
        source: "/api/auth/me",
        destination: "/api/auth/me",
      },
      {
        // Keep /api/auth/login as Next.js API route (proxies to backend)
        source: "/api/auth/login",
        destination: "/api/auth/login",
      },
      {
        // Rewrite all other /api/* requests to backend
        // This strips /api prefix: /api/candidates -> http://localhost:8000/candidates
        // Note: This must come AFTER the specific routes above
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
