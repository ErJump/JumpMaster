/**
 * Preparazione della sessione secondo il metodo di Sly Flourish, *Return of the Lazy Dungeon
 * Master*. I testi che spiegano i passi sono scritti per JumpMaster. SPEC-0010.
 *
 * ⚠ Modulo puro (invariante I1).
 */

export interface PrepItem {
  id: string;
  text: string;
}

export interface Secret extends PrepItem {
  revealed: boolean;
}

export interface SessionPrep {
  characters: string;
  strongStart: string;
  scenes: PrepItem[];
  secrets: Secret[];
  locations: PrepItem[];
  npcs: PrepItem[];
  monsters: PrepItem[];
  rewards: PrepItem[];
}

export type PrepListKey = 'scenes' | 'locations' | 'npcs' | 'monsters' | 'rewards';

export interface PrepStep {
  key: keyof SessionPrep;
  number: number;
  title: string;
  /** A cosa serve il passo, in una o due frasi: un DM alle prime armi non lo sa. */
  why: string;
  kind: 'text' | 'list' | 'secrets';
  placeholder: string;
}

export const PREP_STEPS: readonly PrepStep[] = [
  {
    key: 'characters',
    number: 1,
    title: 'Rivedi i personaggi',
    why: 'Cosa vogliono i personaggi e cosa è successo loro l’ultima volta. La sessione migliore è quella che parla di loro.',
    kind: 'text',
    placeholder: 'Elara cerca notizie della sorella scomparsa; Gorm ha giurato vendetta sul lupo mannaro…',
  },
  {
    key: 'strongStart',
    number: 2,
    title: 'Un inizio forte',
    why: 'La scena d’apertura, che parte già in movimento. Niente «vi svegliate in locanda»: un urlo, un inseguimento, una porta che si spalanca.',
    kind: 'text',
    placeholder: 'Mentre attraversano il ponte, la nebbia si squarcia: tre lupi bloccano il passaggio…',
  },
  {
    key: 'scenes',
    number: 3,
    title: 'Scene possibili',
    why: 'Tre o quattro scene che potrebbero accadere, senza fissarne l’ordine. Se i giocatori ne saltano una, non importa.',
    kind: 'list',
    placeholder: 'Un funerale interrotto da ospiti indesiderati',
  },
  {
    key: 'secrets',
    number: 4,
    title: 'Segreti e indizi',
    why: 'Una decina di cose che i giocatori potrebbero scoprire, non legate a un luogo preciso: le riveli dove capita. Quelle non scoperte passano da sole alla sessione successiva.',
    kind: 'secrets',
    placeholder: 'Il borgomastro non è morto di malattia',
  },
  {
    key: 'locations',
    number: 5,
    title: 'Luoghi fantastici',
    why: 'Pochi luoghi, ognuno con un dettaglio che si ricorda: un odore, un suono, qualcosa di strano.',
    kind: 'list',
    placeholder: 'La cappella, dove le candele bruciano senza consumarsi',
  },
  {
    key: 'npcs',
    number: 6,
    title: 'PNG importanti',
    why: 'Chi potrebbero incontrare, con un appiglio per interpretarlo. Collega le schede: [[Nome]].',
    kind: 'list',
    placeholder: '[[Ismark Kolyanovich]] — stanco, chiama tutti «amico»',
  },
  {
    key: 'monsters',
    number: 7,
    title: 'Mostri rilevanti',
    why: 'Cosa potrebbe servire se si arriva alle armi. Prepara gli scontri nel costruttore.',
    kind: 'list',
    placeholder: 'Lupi (3–5), un lupo mannaro se la notte è di luna piena',
  },
  {
    key: 'rewards',
    number: 8,
    title: 'Ricompense',
    why: 'Oggetti e tesori che potrebbero trovare. Meglio pochi e con una storia.',
    kind: 'list',
    placeholder: 'Il simbolo sacro di San Andral',
  },
];

export function emptyPrep(): SessionPrep {
  return { characters: '', strongStart: '', scenes: [], secrets: [], locations: [], npcs: [], monsters: [], rewards: [] };
}

/**
 * I segreti non rivelati passano alla sessione successiva (SPEC-0010 AC4): nel metodo Lazy DM
 * restano validi finché i giocatori non li scoprono. Tornano «non rivelati», senza doppioni e
 * senza voci vuote.
 */
export function carryOverSecrets(previous: Pick<SessionPrep, 'secrets'> | null | undefined): Secret[] {
  const seen = new Set<string>();
  const result: Secret[] = [];
  for (const secret of previous?.secrets ?? []) {
    const key = secret.text.trim().toLowerCase();
    if (secret.revealed || key === '' || seen.has(key)) continue;
    seen.add(key);
    result.push({ id: secret.id, text: secret.text.trim(), revealed: false });
  }
  return result;
}

/** Quanti segreti sono stati rivelati: il DM lo vede nella cronologia. */
export function secretsProgress(prep: Pick<SessionPrep, 'secrets'>): { revealed: number; total: number } {
  const total = prep.secrets.filter((s) => s.text.trim() !== '').length;
  const revealed = prep.secrets.filter((s) => s.revealed && s.text.trim() !== '').length;
  return { revealed, total };
}
