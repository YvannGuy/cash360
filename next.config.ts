import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppression de output: "export" pour permettre les API routes
  // output: "export", // Commenté pour Vercel deployment avec API routes
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
