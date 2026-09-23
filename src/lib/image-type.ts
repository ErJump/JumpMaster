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
