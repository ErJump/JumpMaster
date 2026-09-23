import { describe, it, expect } from 'vitest';
import { detectImageType, UPLOAD_NAME } from './image-type';

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
