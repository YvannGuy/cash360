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
  // Corriger l'avertissement sur les lockfiles multiples
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
