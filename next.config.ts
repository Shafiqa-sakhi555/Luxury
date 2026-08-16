import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the Prisma engine and the pg driver out of the webpack bundle; they
  // rely on Node built-ins and optional native bindings (pg-native).
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "bcryptjs",
  ],
  // Allow LAN access during dev without cross-origin / HMR WebSocket blocks (Next.js 15+).
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.8",
    "192.168.18.108",
    "192.168.18.147",
  ],
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
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
