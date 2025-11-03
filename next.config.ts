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
  // Exposer les variables d'environnement côté serveur uniquement
  env: {
    // Les variables sans NEXT_PUBLIC_ sont automatiquement disponibles côté serveur
    // Pas besoin de les déclarer ici explicitement
  },
};

export default nextConfig;
