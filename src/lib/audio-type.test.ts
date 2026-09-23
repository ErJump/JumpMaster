import { describe, it, expect } from 'vitest';
import { AUDIO_NAME, detectAudioType } from './audio-type';

const bytes = (...parts: Array<string | number[]>) =>
  new Uint8Array(parts.flatMap((part) => (typeof part === 'string' ? [...part].map((c) => c.charCodeAt(0)) : part)));

describe('detectAudioType', () => {
  it('riconosce i formati comuni dai byte iniziali', () => {
    expect(detectAudioType(bytes('ID3', [4, 0, 0]))?.ext).toBe('mp3');
    expect(detectAudioType(bytes([0xff, 0xfb, 0x90, 0x44]))?.ext).toBe('mp3');
    expect(detectAudioType(bytes('OggS', [0, 2]))?.ext).toBe('ogg');
    expect(detectAudioType(bytes('RIFF', [0, 0, 0, 0], 'WAVEfmt '))?.ext).toBe('wav');
    expect(detectAudioType(bytes('fLaC', [0, 0, 0, 34]))?.ext).toBe('flac');
    expect(detectAudioType(bytes([0, 0, 0, 32], 'ftypM4A ', [0, 0]))).toStrictEqual({ ext: 'm4a', mime: 'audio/mp4' });
  });

  it('non scambia per MP3 un flusso AAC grezzo (layer 00)', () => {
    expect(detectAudioType(bytes([0xff, 0xf1, 0x50, 0x80]))).toBeNull();
  });

  it('rifiuta immagini, testo e file troppo corti', () => {
    expect(detectAudioType(bytes('RIFF', [0, 0, 0, 0], 'WEBPVP8 '))).toBeNull();
    expect(detectAudioType(bytes([0x89], 'PNG'))).toBeNull();
    expect(detectAudioType(bytes('<html>'))).toBeNull();
    expect(detectAudioType(new Uint8Array())).toBeNull();
  });
});

describe('AUDIO_NAME', () => {
  it('accetta solo nomi generati dall’app', () => {
    expect(AUDIO_NAME.test('0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0.mp3')).toBe(true);
    expect(AUDIO_NAME.test('../../etc/passwd.mp3')).toBe(false);
    expect(AUDIO_NAME.test('0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0.png')).toBe(false);
  });
});
