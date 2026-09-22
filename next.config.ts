import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // better-sqlite3 è un modulo nativo: non va bundlato, solo richiesto a runtime lato server.
  serverExternalPackages: ['better-sqlite3'],

  // `typedRoutes` resta disattivato di proposito: quasi ogni link di questa app è
  // dinamico (`/bestiario/<slug>`, `/campagne/<id>`) e con i tipi attivi ognuno
  // richiederebbe la forma verbosa `{ pathname, query }` o un cast. Il beneficio —
  // scoprire un link rotto a compile time invece che cliccandolo — non ripaga la
  // cerimonia su ogni singolo collegamento. Vedi docs/adr/ADR-0007.
};

export default nextConfig;
