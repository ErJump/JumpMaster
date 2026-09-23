import { describe, it, expect } from 'vitest';
import {
  ANCESTRIES,
  definiteArticle,
  generateEncounter,
  generateHook,
  generateName,
  generateNpc,
  generateRumor,
  generateShop,
  generateTavern,
  generateTreasure,
  seeded,
  tavernName,
  treasureTier,
  type EncounterCandidate,
} from './index';
import { HOOK_GENERIC_TWISTS, HOOK_WHAT, RUMOR_WHO } from './tables';
import { evaluateEncounter, type Difficulty } from '../rules/encounter';

const SEEDS = Array.from({ length: 400 }, (_, i) => i + 1);

describe('seeded', () => {
  it('stesso seme, stessa sequenza: i generatori sono verificabili', () => {
    expect(generateNpc(seeded(42))).toStrictEqual(generateNpc(seeded(42)));
    expect(generateNpc(seeded(42))).not.toStrictEqual(generateNpc(seeded(43)));
  });
});

describe('italiano — regole fissate come test', () => {
  it('articolo determinativo', () => {
    expect(definiteArticle('Orso', 'm')).toBe('L’');
    expect(definiteArticle('Aquila', 'f')).toBe('L’');
    expect(definiteArticle('Scoiattolo', 'm')).toBe('Lo ');
    expect(definiteArticle('Zaino', 'm')).toBe('Lo ');
    expect(definiteArticle('Drago', 'm')).toBe('Il ');
    expect(definiteArticle('Sirena', 'f')).toBe('La ');
    expect(definiteArticle('Sale', 'm')).toBe('Il '); // s + vocale: «il»
  });

  it('nessun nome di taverna con l’articolo sbagliato', () => {
    for (const seed of SEEDS) {
      const name = tavernName(seeded(seed));
      expect(name).not.toMatch(/^Il [AEIOU]/);
      expect(name).not.toMatch(/^La [AEIOU]/);
      expect(name).not.toMatch(/^Il (S[^aeiou]|Z)/);
    }
  });

  it('i cognomi umani concordano col luogo: Montenero, non Montenera', () => {
    for (const seed of SEEDS) {
      const family = generateName(seeded(seed), 'umano').family ?? '';
      if (/^(Monte|Ponte|Poggio)/.test(family)) expect(family).toMatch(/[oe]$/);
      if (/^(Rocca|Valle|Fonte|Torre|Selva)/.test(family)) expect(family).toMatch(/[ae]$/);
    }
  });

  it('nessun cognome con aggettivo che non concorda', () => {
    for (const seed of SEEDS) {
      for (const ancestry of ANCESTRIES) {
        const full = generateName(seeded(seed * 7 + ancestry.length), ancestry).full;
        expect(full).not.toMatch(/Barba(spezzato|rosso)|Scintilla (allegro|storto)|(Fiore|Ruscello)(allegra|tonda)/);
      }
    }
  });

  it('le voci concordano il participio col soggetto', () => {
    const expected: Record<string, string> = { ms: 'sia stato visto', fs: 'sia stata vista', mp: 'siano stati visti', fp: 'siano state viste' };
    for (const seed of SEEDS) {
      const { text } = generateRumor(seeded(seed));
      for (const who of RUMOR_WHO) {
        if (text.startsWith(`Dicono che ${who.text} `)) expect(text).toContain(expected[who.form]);
      }
      expect(text).not.toMatch(/\bdi (il|lo|la|i|gli|le) /); // «di il» → «del»
    }
  });
});

describe('generateName', () => {
  it('produce nomi con la maiuscola e senza tre lettere uguali di fila', () => {
    for (const seed of SEEDS) {
      for (const ancestry of ANCESTRIES) {
        const { given } = generateName(seeded(seed), ancestry);
        expect(given.charAt(0)).toBe(given.charAt(0).toUpperCase());
        expect(given).not.toMatch(/(.)\1\1/i);
        expect(given.length).toBeGreaterThan(1);
      }
    }
  });
});

describe('generateNpc', () => {
  it('compila tutti i campi, segreto compreso', () => {
    const npc = generateNpc(seeded(5));
    for (const value of Object.values(npc)) expect(String(value).trim()).not.toBe('');
  });

  it('rispetta ascendenza e mestiere richiesti', () => {
    expect(generateNpc(seeded(5), { ancestry: 'nano', occupation: 'oste' })).toMatchObject({ ancestry: 'nano', occupation: 'oste' });
  });
});

describe('generateHook', () => {
  it('la complicazione riguarda l’incarico, oppure è una di quelle che valgono per tutti', () => {
    for (const seed of SEEDS) {
      const hook = generateHook(seeded(seed));
      const task = HOOK_WHAT.find((t) => t.text === hook.what)!;
      expect([...task.twists, ...HOOK_GENERIC_TWISTS]).toContain(hook.twist);
    }
  });
});

describe('generateTavern', () => {
  it('ha un oste, un piatto, una bevanda e una voce', () => {
    const tavern = generateTavern(seeded(9));
    expect(tavern.keeper.occupation).toBe('oste');
    expect(tavern.dish && tavern.drink && tavern.rumor.text).toBeTruthy();
  });
});

describe('generateShop', () => {
  const equipment = [
    { slug: 'club', name: 'Club', category: 'Weapon', costValue: 1, costUnit: 'sp' },
    { slug: 'dagger', name: 'Dagger', category: 'Weapon', costValue: 2, costUnit: 'gp' },
    { slug: 'longsword', name: 'Longsword', category: 'Weapon', costValue: 15, costUnit: 'gp' },
    { slug: 'shield', name: 'Shield', category: 'Armor', costValue: 10, costUnit: 'gp' },
    { slug: 'chain-mail', name: 'Chain Mail', category: 'Armor', costValue: 75, costUnit: 'gp' },
    { slug: 'rope', name: 'Rope', category: 'Adventuring Gear', costValue: 1, costUnit: 'gp' },
    { slug: 'torch', name: 'Torch', category: 'Adventuring Gear', costValue: 1, costUnit: 'cp' },
    { slug: 'mystery', name: 'Senza prezzo', category: 'Weapon', costValue: null, costUnit: null },
  ];

  it('vende solo merce della sua categoria, coi prezzi del manuale', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      const shop = generateShop(seeded(seed), equipment);
      for (const item of shop.items) {
        const original = equipment.find((e) => e.slug === item.slug)!;
        expect(item.costValue).toBe(original.costValue); // AC7: prezzo invariato
        expect(item.costUnit).toBe(original.costUnit);
        expect(item.costValue).not.toBeNull(); // niente merce senza prezzo
      }
      const categories = new Set(shop.items.map((i) => i.category));
      if (shop.kind === 'Emporio') expect([...categories]).toStrictEqual(['Adventuring Gear']);
      if (shop.kind === 'Armaiolo') for (const c of categories) expect(['Weapon', 'Armor']).toContain(c);
    }
  });

  it('non propone botteghe per cui non c’è merce', () => {
    for (const seed of SEEDS.slice(0, 60)) {
      expect(['Armaiolo', 'Emporio']).toContain(generateShop(seeded(seed), equipment).kind);
    }
  });
});

describe('generateEncounter', () => {
  // Catalogo sintetico con i PE reali della tabella SRD.
  const catalog: EncounterCandidate[] = [
    { slug: 'goblin', name: 'Goblin', cr: 0.25, xp: 50, type: 'humanoid' },
    { slug: 'orc', name: 'Orc', cr: 0.5, xp: 100, type: 'humanoid' },
    { slug: 'gnoll', name: 'Gnoll', cr: 0.5, xp: 100, type: 'humanoid' },
    { slug: 'bugbear', name: 'Bugbear', cr: 1, xp: 200, type: 'humanoid' },
    { slug: 'ogre', name: 'Ogre', cr: 2, xp: 450, type: 'giant' },
    { slug: 'wight', name: 'Wight', cr: 3, xp: 700, type: 'undead' },
    { slug: 'troll', name: 'Troll', cr: 5, xp: 1800, type: 'giant' },
    { slug: 'ghost', name: 'Ghost', cr: 4, xp: 1100, type: 'undead' },
    { slug: 'zombie', name: 'Zombie', cr: 0.25, xp: 50, type: 'undead' },
    { slug: 'skeleton', name: 'Skeleton', cr: 0.25, xp: 50, type: 'undead' },
  ];
  const party = { level: 4, size: 4 };
  const targets: Difficulty[] = ['facile', 'impegnativo', 'duro', 'letale'];

  it('quando dichiara di avercela fatta, la fascia è davvero quella richiesta', () => {
    for (const target of targets) {
      for (const seed of SEEDS.slice(0, 25)) {
        const result = generateEncounter(seeded(seed), catalog, party, target);
        expect(result).not.toBeNull();
        if (result!.exact) expect(result!.evaluation.difficulty).toBe(target);
      }
    }
  });

  it('usa la STESSA stima del costruttore di scontri', () => {
    const result = generateEncounter(seeded(3), catalog, party, 'impegnativo')!;
    expect(evaluateEncounter(result.entries, party)).toStrictEqual(result.evaluation);
  });

  it('con un catalogo ragionevole ci riesce quasi sempre', () => {
    const exact = SEEDS.slice(0, 40).filter((seed) => generateEncounter(seeded(seed), catalog, party, 'impegnativo')?.exact).length;
    expect(exact).toBeGreaterThanOrEqual(36);
  });

  it('rispetta il tipo di mostro richiesto', () => {
    for (const seed of SEEDS.slice(0, 20)) {
      const result = generateEncounter(seeded(seed), catalog, party, 'impegnativo', { type: 'undead' })!;
      for (const entry of result.entries) expect(['wight', 'ghost', 'zombie', 'skeleton']).toContain(entry.slug);
    }
  });

  it('senza gruppo non genera nulla invece di inventare', () => {
    expect(generateEncounter(seeded(1), catalog, { level: 4, size: 0 }, 'facile')).toBeNull();
  });
});

describe('generateTreasure', () => {
  const items = [
    { slug: 'c1', name: 'Comune', rarity: 'Common' },
    { slug: 'u1', name: 'Non comune', rarity: 'Uncommon' },
    { slug: 'r1', name: 'Raro', rarity: 'Rare' },
    { slug: 'v1', name: 'Molto raro', rarity: 'Very Rare' },
    { slug: 'l1', name: 'Leggendario', rarity: 'Legendary' },
    { slug: 'a1', name: 'Artefatto', rarity: 'Artifact' },
  ];

  it('gli oggetti hanno sempre una rarità adatta al livello', () => {
    for (const level of [1, 3, 5, 9, 11, 16, 17, 20]) {
      const allowed = treasureTier(level).rarities as readonly string[];
      for (const seed of SEEDS.slice(0, 50)) {
        for (const item of generateTreasure(seeded(seed), level, items).items) expect(allowed).toContain(item.rarity);
      }
    }
  });

  it('mai un artefatto, e mai due volte lo stesso oggetto', () => {
    for (const seed of SEEDS) {
      const { items: found } = generateTreasure(seeded(seed), 20, items);
      expect(found.map((i) => i.rarity)).not.toContain('Artifact');
      expect(new Set(found.map((i) => i.slug)).size).toBe(found.length);
    }
  });

  it('le monete d’oro crescono col livello', () => {
    const average = (level: number) =>
      SEEDS.reduce((sum, seed) => sum + generateTreasure(seeded(seed), level, items).coins.oro, 0) / SEEDS.length;
    expect(average(10)).toBeGreaterThan(average(2) * 3);
  });
});
