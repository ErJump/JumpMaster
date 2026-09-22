import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // better-sqlite3 è un modulo nativo: non va bundlato, solo richiesto a runtime lato server.
  serverExternalPackages: ['better-sqlite3'],
  typedRoutes: true,
};

export default nextConfig;
