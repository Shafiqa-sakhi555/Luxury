import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN access during dev without cross-origin warnings (Next.js 15+).
  allowedDevOrigins: ["192.168.18.108", "localhost", "127.0.0.1"],
  images: {
    // Avoid server-side Unsplash fetches timing out in slow/offline dev environments.
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
