/**
 * Riconosce il tipo di un'immagine dai **primi byte** (magic number), non dall'estensione
 * né dal tipo dichiarato dal browser: entrambi si possono falsificare.
 */
export type ImageType = { ext: 'png' | 'jpg' | 'gif' | 'webp'; mime: string };

export function detectImageType(bytes: Uint8Array): ImageType | null {
  const at = (i: number) => bytes[i];
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...Array.from(bytes.subarray(start, start + length)));

  if (at(0) === 0x89 && ascii(1, 3) === 'PNG') return { ext: 'png', mime: 'image/png' };
  if (at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (ascii(0, 4) === 'GIF8') return { ext: 'gif', mime: 'image/gif' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  return null;
}

/** Nome di file generato dall'app: l'unica forma che la rotta delle immagini accetta di servire. */
export const UPLOAD_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|gif|webp)$/;

export const MIME_BY_EXT: Record<ImageType['ext'], string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

/**
 * Larghezza e altezza lette dall'intestazione del file (SPEC-0012 AC3): il DM non deve saperle,
 * e la griglia della mappa ne ha bisogno. Restituisce `null` se l'intestazione non è leggibile.
 */
export function imageSize(bytes: Uint8Array): { width: number; height: number } | null {
  const type = detectImageType(bytes);
  if (!type) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const has = (n: number) => bytes.length >= n;

  switch (type.ext) {
    case 'png': // IHDR: larghezza e altezza a 16 e 20, big endian
      return has(24) ? { width: view.getUint32(16), height: view.getUint32(20) } : null;

    case 'gif': // schermo logico a 6 e 8, little endian
      return has(10) ? { width: view.getUint16(6, true), height: view.getUint16(8, true) } : null;

    case 'webp': {
      const chunk = String.fromCharCode(...Array.from(bytes.subarray(12, 16)));
      if (chunk === 'VP8X' && has(30)) {
        const read24 = (at: number) => bytes[at]! | (bytes[at + 1]! << 8) | (bytes[at + 2]! << 16);
        return { width: read24(24) + 1, height: read24(27) + 1 };
      }
      if (chunk === 'VP8 ' && has(30)) {
        return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
      }
      if (chunk === 'VP8L' && has(25)) {
        const bits = view.getUint32(21, true);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      return null;
    }

    case 'jpg': {
      // Si scorrono i segmenti fino a un marcatore SOF (Start Of Frame), che contiene le dimensioni.
      let at = 2;
      while (at + 9 < bytes.length) {
        if (bytes[at] !== 0xff) return null;
        const marker = bytes[at + 1]!;
        const length = view.getUint16(at + 2);
        const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSof) return { height: view.getUint16(at + 5), width: view.getUint16(at + 7) };
        at += 2 + length;
      }
      return null;
    }
  }
}
