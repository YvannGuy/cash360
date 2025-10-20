import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour déploiement statique (plus d'API routes)
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    // ignoreBuildErrors: true,
  },
  // Corriger l'avertissement sur les lockfiles multiples
  outputFileTracingRoot: __dirname,
  // Désactiver les API routes pour le déploiement statique
  trailingSlash: true,
};

export default nextConfig;
