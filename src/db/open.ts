/**
 * Apertura del database, **sicura fra processi**. Vedi ADR-0010.
 *
 * Usato dal client dell'app e dagli script. Qui niente `server-only`: gli script girano fuori
 * da Next.
 *
 * Perché serve un lock: `next build` raccoglie i dati delle pagine con più processi in parallelo,
 * e ognuno apre il database. Se ognuno applicasse le migrazioni da solo, due processi
 * leggerebbero «nessuna migrazione applicata» nello stesso istante e creerebbero le stesse
 * tabelle — «table already exists», oppure «database is locked». Riprodotto con otto processi
 * concorrenti: 9 round su 10 fallivano.
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { closeSync, existsSync, mkdirSync, openSync, statSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const LOCK_WAIT_MS = 30_000;
/** Un lock più vecchio di così appartiene a un processo morto a metà: si può rimuovere. */
const STALE_LOCK_MS = 30_000;

/** Pausa **sincrona**: `migrate` di better-sqlite3 è sincrono, e così deve esserlo l'attesa. */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Esegue `fn` tenendo un lock esclusivo fra processi. La creazione di un file in modalità
 * `wx` è atomica: fallisce se il file esiste già, quindi uno solo alla volta la spunta.
 */
export function withFileLock<T>(lockPath: string, fn: () => T): T {
  const deadline = Date.now() + LOCK_WAIT_MS;

  for (;;) {
    try {
      closeSync(openSync(lockPath, 'wx'));
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;

      try {
        if (Date.now() - statSync(lockPath).mtimeMs > STALE_LOCK_MS) {
          unlinkSync(lockPath);
          continue;
        }
      } catch {
        // Il lock è sparito mentre lo guardavamo: si riprova subito.
        continue;
      }

      if (Date.now() > deadline) {
        throw new Error(`Il database è bloccato da un altro processo da più di ${LOCK_WAIT_MS / 1000} secondi (${lockPath}).`);
      }
      sleepSync(25);
    }
  }

  try {
    return fn();
  } finally {
    try {
      unlinkSync(lockPath);
    } catch {
      // già rimosso
    }
  }
}

export function databasePath(): string {
  return process.env.JUMPMASTER_DB ?? resolve(/* turbopackIgnore: true */ process.cwd(), 'data/jumpmaster.db');
}

/**
 * Apre il database e lo porta all'ultima versione dello schema.
 *
 * Tutto ciò che tocca lo schema o la modalità del giornale avviene **sotto il lock**; chi arriva
 * dopo trova le migrazioni già applicate e `migrate` non fa nulla.
 */
export function openDatabase(path = databasePath()): Database.Database {
  mkdirSync(dirname(path), { recursive: true });

  return withFileLock(`${path}.lock`, () => {
    // Oltre il lock, letture e scritture concorrenti restano possibili: il timeout fa aspettare
    // invece di fallire subito se un altro processo sta scrivendo.
    const connection = new Database(path, { timeout: 10_000 });
    // WAL: letture e scritture concorrenti senza bloccarsi. Serve perché la Vista Giocatori
    // legge dallo stesso file mentre il pannello DM scrive.
    connection.pragma('journal_mode = WAL');
    connection.pragma('foreign_keys = ON');

    const migrationsFolder = resolve(/* turbopackIgnore: true */ process.cwd(), 'src/db/migrations');
    if (existsSync(migrationsFolder)) {
      migrate(drizzle(connection, { casing: 'snake_case' }), { migrationsFolder });
    }

    return connection;
  });
}
