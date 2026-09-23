/**
 * Riconosce un file audio dai **primi byte**, come le immagini (`image-type.ts`): estensione e
 * tipo dichiarato dal browser si possono falsificare.
 */
export type AudioExt = 'mp3' | 'ogg' | 'wav' | 'm4a' | 'flac';
export type AudioType = { ext: AudioExt; mime: string };

export const AUDIO_MIME_BY_EXT: Record<AudioExt, string> = {
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
};

/** Marche del contenitore MP4 che indicano audio (o un MP4 generico, che il browser sa suonare). */
const MP4_BRANDS = new Set(['M4A ', 'M4B ', 'mp42', 'mp41', 'isom', 'iso2', 'dash']);

export function detectAudioType(bytes: Uint8Array): AudioType | null {
  const at = (i: number) => bytes[i] ?? -1;
  const ascii = (start: number, length: number) => String.fromCharCode(...Array.from(bytes.subarray(start, start + length)));
  const type = (ext: AudioExt): AudioType => ({ ext, mime: AUDIO_MIME_BY_EXT[ext] });

  if (ascii(0, 3) === 'ID3') return type('mp3');
  // Sincronismo di un frame MPEG audio: 11 bit a 1, e un «layer» diverso da 00 (che sarebbe AAC).
  if (at(0) === 0xff && (at(1) & 0xe0) === 0xe0 && (at(1) & 0x06) !== 0) return type('mp3');
  if (ascii(0, 4) === 'OggS') return type('ogg');
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WAVE') return type('wav');
  if (ascii(0, 4) === 'fLaC') return type('flac');
  if (ascii(4, 4) === 'ftyp' && MP4_BRANDS.has(ascii(8, 4))) return type('m4a');
  return null;
}

/** Nome generato dall'app per un file audio: l'unica forma che la rotta dei file accetta. */
export const AUDIO_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp3|ogg|wav|m4a|flac)$/;
