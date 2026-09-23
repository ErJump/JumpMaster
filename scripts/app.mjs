#!/usr/bin/env node
/**
 * Avviatore di JumpMaster come app (SPEC-0017, ADR-0014).
 *
 *   npm run app                 compila se serve, avvia il server in background, apre la finestra
 *   npm run app -- --stop       spegne il server
 *   npm run app -- --no-open    avvia senza aprire la finestra (prove, script)
 *   npm run app:install         (macOS) crea ~/Applications/JumpMaster.app
 *   npm run app:install -- --dest <cartella>   …in un'altra cartella
 *
 * Nessuna dipendenza: solo Node. Il server di produzione gira su una porta sua (3210), così non
 * si scontra con `npm run dev` (3000).
 */
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.JUMPMASTER_PORT ?? 3210);
const URL_BASE = `http://localhost:${PORT}`;
const DATA = join(ROOT, 'data');
const PID_FILE = join(DATA, 'app.pid');
const LOG_FILE = join(DATA, 'app.log');
const NEXT_BIN = join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');

const args = process.argv.slice(2);
const say = (text) => console.log(`  ⚔  ${text}`);

/* ── Il server ────────────────────────────────────────────────────── */

/** È acceso JumpMaster su quella porta? Si chiede alla rotta di salute, non basta che risponda qualcosa. */
async function isUp() {
  try {
    const response = await fetch(`${URL_BASE}/api/salute`, { signal: AbortSignal.timeout(1500) });
    const body = await response.json();
    return body?.app === 'jumpmaster';
  } catch {
    return false;
  }
}

function newestMtime(path) {
  const stat = statSync(path);
  if (!stat.isDirectory()) return stat.mtimeMs;
  let newest = stat.mtimeMs;
  for (const entry of readdirSync(path)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    newest = Math.max(newest, newestMtime(join(path, entry)));
  }
  return newest;
}

/** Serve compilare se non c'è una build, o se il codice è più nuovo (dopo un `git pull`). */
function needsBuild() {
  const buildId = join(ROOT, '.next', 'BUILD_ID');
  if (!existsSync(buildId)) return true;
  const built = statSync(buildId).mtimeMs;
  const sources = ['src', 'package.json', 'next.config.ts'].map((p) => join(ROOT, p)).filter(existsSync);
  return sources.some((source) => newestMtime(source) > built);
}

function build() {
  say('Preparo JumpMaster (la prima volta ci vuole un minuto)…');
  execFileSync(process.execPath, [NEXT_BIN, 'build'], { cwd: ROOT, stdio: 'inherit' });
}

function startServer() {
  mkdirSync(DATA, { recursive: true });
  const log = openSync(LOG_FILE, 'a');
  // Staccato dal terminale: chiudendo la finestra del terminale (o avviando dall'app del Dock)
  // JumpMaster resta acceso.
  const child = spawn(process.execPath, [NEXT_BIN, 'start', '-p', String(PORT)], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', log, log],
    env: { ...process.env, NODE_ENV: 'production' },
  });
  child.unref();
  writeFileSync(PID_FILE, String(child.pid));
}

async function waitUntilUp(seconds) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    if (await isUp()) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function stopServer() {
  if (!existsSync(PID_FILE)) return false;
  const pid = Number(readFileSync(PID_FILE, 'utf8'));
  try {
    process.kill(pid);
  } catch {
    // già spento
  }
  unlinkSync(PID_FILE);
  return true;
}

/* ── La finestra ──────────────────────────────────────────────────── */

/** I browser che sanno aprire una finestra senza barra (`--app`). */
const APP_MODE_BROWSERS = ['Google Chrome', 'Microsoft Edge', 'Brave Browser', 'Vivaldi', 'Chromium'];

function macAppPath(name) {
  return [join('/Applications', `${name}.app`), join(homedir(), 'Applications', `${name}.app`)].find(existsSync);
}

function openWindow() {
  if (process.platform === 'darwin') {
    const browser = APP_MODE_BROWSERS.find(macAppPath);
    if (browser) {
      spawn('open', ['-na', browser, '--args', `--app=${URL_BASE}`], { stdio: 'ignore', detached: true }).unref();
      return `una finestra di ${browser}`;
    }
    spawn('open', [URL_BASE], { stdio: 'ignore', detached: true }).unref();
    return 'il browser predefinito';
  }
  if (process.platform === 'win32') {
    // Edge c'è su ogni Windows recente.
    spawn('cmd', ['/c', 'start', '', 'msedge', `--app=${URL_BASE}`], { stdio: 'ignore', detached: true, windowsHide: true }).unref();
    return 'una finestra di Edge';
  }
  spawn('xdg-open', [URL_BASE], { stdio: 'ignore', detached: true }).unref();
  return 'il browser predefinito';
}

/* ── L'app per il Dock (macOS) ────────────────────────────────────── */

function installMacApp(destination) {
  if (process.platform !== 'darwin') throw new Error('L’app per il Dock si crea solo su macOS. Altrove: `npm run app`.');
  const app = join(destination, 'JumpMaster.app');
  rmSync(app, { recursive: true, force: true });
  mkdirSync(join(app, 'Contents', 'MacOS'), { recursive: true });
  mkdirSync(join(app, 'Contents', 'Resources'), { recursive: true });

  writeFileSync(
    join(app, 'Contents', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>JumpMaster</string>
  <key>CFBundleDisplayName</key><string>JumpMaster</string>
  <key>CFBundleIdentifier</key><string>dev.jumpmaster.launcher</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleExecutable</key><string>JumpMaster</string>
  <key>CFBundleIconFile</key><string>AppIcon</string>
  <key>LSUIElement</key><true/>
</dict>
</plist>
`,
  );

  // Le app aperte dal Finder non hanno il PATH del terminale: si scrive il percorso assoluto di Node.
  const launcher = join(app, 'Contents', 'MacOS', 'JumpMaster');
  writeFileSync(launcher, `#!/bin/sh\ncd "${ROOT}" && exec "${stableNodePath()}" "${join(ROOT, 'scripts', 'app.mjs')}" >> "${LOG_FILE}" 2>&1\n`);
  chmodSync(launcher, 0o755);
  return app;
}

/**
 * Il Node del terminale, com'è nel PATH (es. `/opt/homebrew/bin/node`): è un collegamento che resta
 * valido dopo un aggiornamento. `process.execPath` è il percorso reale, con la versione dentro, e
 * sparirebbe al primo `brew upgrade`.
 */
function stableNodePath() {
  try {
    const found = execFileSync('/bin/sh', ['-lc', 'command -v node'], { encoding: 'utf8' }).trim();
    if (found && existsSync(found)) return found;
  } catch {
    // niente shell di login: si ripiega sul percorso reale
  }
  return process.execPath;
}

/** L'icona `.icns` dall'icona che l'app stessa disegna (`/icons/512.png`). */
async function writeMacIcon(app) {
  const work = join(tmpdir(), `jumpmaster-icon-${process.pid}`);
  const iconset = join(work, 'AppIcon.iconset');
  mkdirSync(iconset, { recursive: true });
  const png = join(work, 'icon.png');
  const response = await fetch(`${URL_BASE}/icons/512.png`);
  writeFileSync(png, Buffer.from(await response.arrayBuffer()));
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      const pixels = size * scale;
      if (pixels > 512) continue;
      const name = scale === 1 ? `icon_${size}x${size}.png` : `icon_${size}x${size}@2x.png`;
      execFileSync('sips', ['-z', String(pixels), String(pixels), png, '--out', join(iconset, name)], { stdio: 'ignore' });
    }
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', join(app, 'Contents', 'Resources', 'AppIcon.icns')]);
  rmSync(work, { recursive: true, force: true });
}

/* ── Via ──────────────────────────────────────────────────────────── */

async function ensureRunning() {
  if (await isUp()) return 'già acceso';
  if (needsBuild()) build();
  startServer();
  if (!(await waitUntilUp(60))) {
    throw new Error(`Il server non risponde. Guarda ${LOG_FILE} per capire perché.`);
  }
  return 'acceso';
}

async function main() {
  if (args.includes('--stop')) {
    say(stopServer() ? 'JumpMaster spento.' : 'JumpMaster non era acceso (da questo avviatore).');
    return;
  }

  if (args.includes('--install')) {
    const destIndex = args.indexOf('--dest');
    const destination = destIndex >= 0 ? resolve(args[destIndex + 1] ?? '') : join(homedir(), 'Applications');
    mkdirSync(destination, { recursive: true });
    const app = installMacApp(destination);
    await ensureRunning();
    await writeMacIcon(app);
    say(`Creata ${app}. Trascinala nel Dock: un clic e JumpMaster parte.`);
    return;
  }

  const state = await ensureRunning();
  if (args.includes('--no-open')) return say(`JumpMaster ${state} su ${URL_BASE}.`);
  const where = openWindow();
  say(`JumpMaster ${state} su ${URL_BASE} — l'ho aperto in ${where}.`);
  say('Per spegnerlo: npm run app -- --stop');
}

main().catch((error) => {
  console.error(`  ✗  ${error.message}`);
  process.exit(1);
});
