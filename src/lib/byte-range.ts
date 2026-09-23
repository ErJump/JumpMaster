/**
 * Interpreta un'intestazione `Range: bytes=…` (RFC 9110 §14.1.2) per un solo intervallo.
 * `null` = nessuna richiesta di intervallo (o una che si ignora, come quelle multiple): si serve
 * tutto il file. Gli estremi restituiti sono inclusi.
 */
export function byteRange(header: string | null, size: number): { start: number; end: number } | 'unsatisfiable' | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, from, to] = match;
  if (from === '' && to === '') return null;

  if (from === '') {
    // `bytes=-500`: gli ultimi 500 byte.
    const suffix = Number(to);
    if (suffix === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(from);
  const end = to === '' ? size - 1 : Math.min(Number(to), size - 1);
  if (start >= size || end < start) return 'unsatisfiable';
  return { start, end };
}
