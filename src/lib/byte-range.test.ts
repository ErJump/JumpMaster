import { describe, it, expect } from 'vitest';
import { byteRange } from './byte-range';

describe('byteRange', () => {
  it('senza intestazione si serve tutto', () => {
    expect(byteRange(null, 100)).toBeNull();
  });

  it('intervalli aperti, chiusi e finali', () => {
    expect(byteRange('bytes=0-', 100)).toStrictEqual({ start: 0, end: 99 });
    expect(byteRange('bytes=10-19', 100)).toStrictEqual({ start: 10, end: 19 });
    expect(byteRange('bytes=90-500', 100)).toStrictEqual({ start: 90, end: 99 });
    expect(byteRange('bytes=-10', 100)).toStrictEqual({ start: 90, end: 99 });
    expect(byteRange('bytes=-500', 100)).toStrictEqual({ start: 0, end: 99 });
  });

  it('fuori dal file è insoddisfacibile', () => {
    expect(byteRange('bytes=100-', 100)).toBe('unsatisfiable');
    expect(byteRange('bytes=50-40', 100)).toBe('unsatisfiable');
    expect(byteRange('bytes=-0', 100)).toBe('unsatisfiable');
  });

  it('forme che non gestiamo si ignorano: si serve il file intero', () => {
    expect(byteRange('bytes=0-10,20-30', 100)).toBeNull();
    expect(byteRange('items=0-10', 100)).toBeNull();
    expect(byteRange('bytes=-', 100)).toBeNull();
  });
});
