import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
