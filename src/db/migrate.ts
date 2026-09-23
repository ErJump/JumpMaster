/**
 * Applica le migrazioni al database locale. Eseguito da `npm run db:migrate`.
 *
 * Usa la stessa apertura protetta da lock dell'app (ADR-0010): si può lanciare anche con il
 * dev server acceso.
 */
import { databasePath, openDatabase } from './open';

const path = databasePath();
openDatabase(path).close();
console.log(`✓ Migrazioni applicate → ${path}`);
