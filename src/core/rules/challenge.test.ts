import { describe, it, expect } from 'vitest';
import { crLabel, crFromLabel, crToXp, allChallengeRatings } from './challenge';

describe('crLabel', () => {
  it('rende i gradi frazionari come frazioni tipografiche, non come decimali', () => {
    // È il criterio SPEC-0003 AC6: mostrare "GS 0.125" a un DM è inaccettabile.
    expect(crLabel(0.125)).toBe('⅛');
    expect(crLabel(0.25)).toBe('¼');
    expect(crLabel(0.5)).toBe('½');
  });

  it('lascia intatti i gradi interi', () => {
    expect(crLabel(0)).toBe('0');
    expect(crLabel(1)).toBe('1');
    expect(crLabel(10)).toBe('10');
    expect(crLabel(30)).toBe('30');
  });
});

describe('crFromLabel', () => {
  it('riconosce le frazioni tipografiche', () => {
    expect(crFromLabel('⅛')).toBe(0.125);
    expect(crFromLabel('¼')).toBe(0.25);
    expect(crFromLabel('½')).toBe(0.5);
  });

  it('accetta anche la forma digitata con la barra', () => {
    expect(crFromLabel('1/8')).toBe(0.125);
    expect(crFromLabel('1/4')).toBe(0.25);
    expect(crFromLabel('1 / 2')).toBe(0.5);
  });

  it('accetta i numeri e ignora gli spazi', () => {
    expect(crFromLabel('5')).toBe(5);
    expect(crFromLabel('  12 ')).toBe(12);
  });

  it('restituisce null su input non validi, divisione per zero inclusa', () => {
    expect(crFromLabel('drago')).toBeNull();
    expect(crFromLabel('1/0')).toBeNull();
    expect(crFromLabel('')).toBeNull();
  });

  it('è l’inverso di crLabel su tutti i gradi esistenti', () => {
    for (const { cr } of allChallengeRatings()) {
      expect(crFromLabel(crLabel(cr))).toBe(cr);
    }
  });
});

describe('crToXp', () => {
  it('segue la tabella dei PE dell’SRD', () => {
    expect(crToXp(0)).toBe(10);
    expect(crToXp(0.125)).toBe(25);
    expect(crToXp(0.25)).toBe(50);
    expect(crToXp(0.5)).toBe(100);
    expect(crToXp(1)).toBe(200);
    expect(crToXp(5)).toBe(1800);
    expect(crToXp(10)).toBe(5900); // Aboleth: 5.900 PE sul manuale
    expect(crToXp(20)).toBe(25000);
    expect(crToXp(30)).toBe(155000);
  });

  it('restituisce null per gradi inesistenti invece di interpolare', () => {
    expect(crToXp(0.3)).toBeNull();
    expect(crToXp(31)).toBeNull();
    expect(crToXp(-1)).toBeNull();
  });
});

describe('allChallengeRatings', () => {
  it('elenca i 34 gradi di sfida in ordine crescente', () => {
    const all = allChallengeRatings();
    expect(all).toHaveLength(34); // 0, ⅛, ¼, ½, poi 1–30
    expect(all[0]?.cr).toBe(0);
    expect(all.at(-1)?.cr).toBe(30);

    const values = all.map((entry) => entry.cr);
    expect(values).toStrictEqual([...values].sort((a, b) => a - b));
  });
});
