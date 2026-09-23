import { describe, it, expect } from 'vitest';
import { detectImageType, imageSize, UPLOAD_NAME } from './image-type';

const bytes = (...values: Array<number | string>) =>
  new Uint8Array(values.flatMap((v) => (typeof v === 'string' ? [...v].map((c) => c.charCodeAt(0)) : [v])));

describe('detectImageType', () => {
  it('riconosce i quattro formati dai byte iniziali', () => {
    expect(detectImageType(bytes(0x89, 'PNG', 0x0d, 0x0a))?.ext).toBe('png');
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe('jpg');
    expect(detectImageType(bytes('GIF89a'))?.ext).toBe('gif');
    expect(detectImageType(bytes('RIFF', 0, 0, 0, 0, 'WEBP'))?.ext).toBe('webp');
  });

  it('rifiuta ciò che non è un’immagine, qualunque estensione avesse', () => {
    expect(detectImageType(bytes('<svg xmlns="'))).toBeNull(); // SVG: può contenere script
    expect(detectImageType(bytes('%PDF-1.7'))).toBeNull();
    expect(detectImageType(bytes('MZ'))).toBeNull(); // eseguibile
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});

describe('UPLOAD_NAME', () => {
  it('accetta solo nomi generati dall’app', () => {
    expect(UPLOAD_NAME.test('3f2b8c1e-9a4d-4e2f-8b1a-0c9d8e7f6a5b.png')).toBe(true);
  });

  it('rifiuta percorsi e nomi arbitrari', () => {
    for (const name of ['../jumpmaster.db', '..%2F..%2Fetc%2Fpasswd', 'mappa.png', 'x.svg', '3f2b8c1e-9a4d-4e2f-8b1a-0c9d8e7f6a5b.png/../..']) {
      expect(UPLOAD_NAME.test(name)).toBe(false);
    }
  });
});

describe('imageSize', () => {
  const u32be = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const u16le = (n: number) => [n & 255, (n >>> 8) & 255];
  const u16be = (n: number) => [(n >>> 8) & 255, n & 255];

  it('legge un PNG', () => {
    const png = bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 'IHDR', ...u32be(1400), ...u32be(1050));
    expect(imageSize(png)).toStrictEqual({ width: 1400, height: 1050 });
  });

  it('legge una GIF', () => {
    expect(imageSize(bytes('GIF89a', ...u16le(640), ...u16le(480)))).toStrictEqual({ width: 640, height: 480 });
  });

  it('legge un JPEG saltando i segmenti che precedono le dimensioni', () => {
    const jpeg = bytes(
      0xff, 0xd8,
      0xff, 0xe0, ...u16be(16), 'JFIF', 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, // APP0 da saltare
      0xff, 0xc0, ...u16be(17), 8, ...u16be(900), ...u16be(1200), 3, // SOF0: altezza 900, larghezza 1200
    );
    expect(imageSize(jpeg)).toStrictEqual({ width: 1200, height: 900 });
  });

  it('legge un WebP «lossy» (VP8)', () => {
    const webp = bytes('RIFF', 0, 0, 0, 0, 'WEBP', 'VP8 ', 0, 0, 0, 0, 0, 0, 0, 0x9d, 0x01, 0x2a, ...u16le(800), ...u16le(600));
    expect(imageSize(webp)).toStrictEqual({ width: 800, height: 600 });
  });

  it('restituisce null su file non riconosciuti o troncati', () => {
    expect(imageSize(bytes('<svg'))).toBeNull();
    expect(imageSize(bytes(0x89, 'PNG'))).toBeNull();
  });
});
