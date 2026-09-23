import { describe, it, expect } from 'vitest';
import { PREP_STEPS, carryOverSecrets, emptyPrep, secretsProgress } from './prep';

describe('PREP_STEPS', () => {
  it('sono gli otto passi, in ordine, ognuno con la sua spiegazione', () => {
    expect(PREP_STEPS.map((s) => s.number)).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const step of PREP_STEPS) expect(step.why.length).toBeGreaterThan(40);
  });

  it('coprono tutti i campi della preparazione', () => {
    expect(PREP_STEPS.map((s) => s.key).sort()).toStrictEqual(Object.keys(emptyPrep()).sort());
  });
});

describe('carryOverSecrets', () => {
  it('porta nella sessione successiva solo i segreti NON rivelati', () => {
    const next = carryOverSecrets({
      secrets: [
        { id: 'a', text: 'Il borgomastro è stato avvelenato', revealed: true },
        { id: 'b', text: 'Ireena è la reincarnazione di Tatyana', revealed: false },
        { id: 'c', text: 'Il prete nasconde il figlio nella cripta', revealed: false },
      ],
    });
    expect(next.map((s) => s.id)).toStrictEqual(['b', 'c']);
    expect(next.every((s) => !s.revealed)).toBe(true);
  });

  it('scarta voci vuote e doppioni', () => {
    const next = carryOverSecrets({
      secrets: [
        { id: 'a', text: '  ', revealed: false },
        { id: 'b', text: 'Il prete mente', revealed: false },
        { id: 'c', text: 'il prete mente ', revealed: false },
      ],
    });
    expect(next).toStrictEqual([{ id: 'b', text: 'Il prete mente', revealed: false }]);
  });

  it('senza sessione precedente non porta nulla', () => {
    expect(carryOverSecrets(null)).toStrictEqual([]);
    expect(carryOverSecrets(undefined)).toStrictEqual([]);
  });
});

describe('secretsProgress', () => {
  it('conta i rivelati sul totale, ignorando le voci vuote', () => {
    expect(
      secretsProgress({
        secrets: [
          { id: 'a', text: 'uno', revealed: true },
          { id: 'b', text: 'due', revealed: false },
          { id: 'c', text: '', revealed: true },
        ],
      }),
    ).toStrictEqual({ revealed: 1, total: 2 });
  });
});
