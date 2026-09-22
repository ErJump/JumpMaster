/**
 * Glossario dei termini di gioco, IT ↔ EN.
 *
 * Vive in `lib/` e non dentro la feature `glossary` perché è **conoscenza condivisa**:
 * anche la pagina delle regole la usa per affiancare il nome italiano di una condizione
 * a quello inglese. La feature `glossary` ne è soltanto la presentazione.
 *
 * Fonte di verità per gli agenti: `docs/memory/glossary-dnd.md`. Quando aggiungi un
 * termine, aggiornali entrambi.
 */
import { normalizeForSearch } from './text';

export type GlossaryCategory =
  | 'condizione'
  | 'caratteristica'
  | 'abilità'
  | 'combattimento'
  | 'danno'
  | 'gioco';

export interface GlossaryTerm {
  en: string;
  it: string;
  category: GlossaryCategory;
  /** Spiegazione in una riga: serve al DM che il termine non lo conosce ancora. */
  note?: string;
}

export const GLOSSARY_CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  condizione: 'Condizioni',
  caratteristica: 'Caratteristiche',
  abilità: 'Abilità',
  combattimento: 'Combattimento',
  danno: 'Tipi di danno',
  gioco: 'Termini di gioco',
};

export const GLOSSARY: readonly GlossaryTerm[] = [
  // ── Condizioni ──────────────────────────────────────────────────
  { en: 'Blinded', it: 'Accecato', category: 'condizione', note: 'Non vede. Gli attacchi contro di lui hanno vantaggio, i suoi svantaggio.' },
  { en: 'Charmed', it: 'Affascinato', category: 'condizione', note: 'Non può attaccare chi lo ha affascinato.' },
  { en: 'Deafened', it: 'Assordato', category: 'condizione', note: 'Non sente e fallisce le prove basate sull’udito.' },
  { en: 'Frightened', it: 'Spaventato', category: 'condizione', note: 'Svantaggio finché vede la fonte della paura; non può avvicinarsi.' },
  { en: 'Grappled', it: 'Afferrato', category: 'condizione', note: 'Velocità ridotta a 0.' },
  { en: 'Incapacitated', it: 'Incapacitato', category: 'condizione', note: 'Non può compiere azioni né reazioni.' },
  { en: 'Invisible', it: 'Invisibile', category: 'condizione', note: 'I suoi attacchi hanno vantaggio, quelli contro di lui svantaggio.' },
  { en: 'Paralyzed', it: 'Paralizzato', category: 'condizione', note: 'Incapacitato e immobile. I colpi a distanza ravvicinata sono critici.' },
  { en: 'Petrified', it: 'Pietrificato', category: 'condizione', note: 'Trasformato in pietra: incapacitato e resistente a tutti i danni.' },
  { en: 'Poisoned', it: 'Avvelenato', category: 'condizione', note: 'Svantaggio ai tiri per colpire e alle prove di caratteristica.' },
  { en: 'Prone', it: 'Prono', category: 'condizione', note: 'A terra. Muoversi costa il doppio; svantaggio agli attacchi.' },
  { en: 'Restrained', it: 'Trattenuto', category: 'condizione', note: 'Velocità 0, svantaggio agli attacchi e ai TS su Destrezza.' },
  { en: 'Stunned', it: 'Stordito', category: 'condizione', note: 'Incapacitato; fallisce automaticamente i TS su Forza e Destrezza.' },
  { en: 'Unconscious', it: 'Privo di sensi', category: 'condizione', note: 'Incosciente, lascia cadere tutto. I colpi ravvicinati sono critici.' },
  { en: 'Exhaustion', it: 'Indebolimento', category: 'condizione', note: 'Sei livelli cumulativi; il sesto è la morte.' },

  // ── Caratteristiche ─────────────────────────────────────────────
  { en: 'Strength', it: 'Forza', category: 'caratteristica', note: 'FOR' },
  { en: 'Dexterity', it: 'Destrezza', category: 'caratteristica', note: 'DES' },
  { en: 'Constitution', it: 'Costituzione', category: 'caratteristica', note: 'COS' },
  { en: 'Intelligence', it: 'Intelligenza', category: 'caratteristica', note: 'INT' },
  { en: 'Wisdom', it: 'Saggezza', category: 'caratteristica', note: 'SAG' },
  { en: 'Charisma', it: 'Carisma', category: 'caratteristica', note: 'CAR' },

  // ── Abilità ─────────────────────────────────────────────────────
  { en: 'Acrobatics', it: 'Acrobazia', category: 'abilità' },
  { en: 'Animal Handling', it: 'Addestrare Animali', category: 'abilità' },
  { en: 'Arcana', it: 'Arcano', category: 'abilità' },
  { en: 'Athletics', it: 'Atletica', category: 'abilità' },
  { en: 'Deception', it: 'Inganno', category: 'abilità' },
  { en: 'History', it: 'Storia', category: 'abilità' },
  { en: 'Insight', it: 'Intuizione', category: 'abilità' },
  { en: 'Intimidation', it: 'Intimidire', category: 'abilità' },
  { en: 'Investigation', it: 'Indagare', category: 'abilità' },
  { en: 'Medicine', it: 'Medicina', category: 'abilità' },
  { en: 'Nature', it: 'Natura', category: 'abilità' },
  { en: 'Perception', it: 'Percezione', category: 'abilità' },
  { en: 'Performance', it: 'Intrattenere', category: 'abilità' },
  { en: 'Persuasion', it: 'Persuasione', category: 'abilità' },
  { en: 'Religion', it: 'Religione', category: 'abilità' },
  { en: 'Sleight of Hand', it: 'Rapidità di Mano', category: 'abilità' },
  { en: 'Stealth', it: 'Furtività', category: 'abilità' },
  { en: 'Survival', it: 'Sopravvivenza', category: 'abilità' },

  // ── Combattimento ───────────────────────────────────────────────
  { en: 'Armor Class (AC)', it: 'Classe Armatura (CA)', category: 'combattimento', note: 'Quanto è difficile colpire una creatura.' },
  { en: 'Hit Points (HP)', it: 'Punti Ferita (PF)', category: 'combattimento' },
  { en: 'Saving Throw', it: 'Tiro Salvezza (TS)', category: 'combattimento', note: 'Si tira per resistere a un effetto.' },
  { en: 'Ability Check', it: 'Prova di caratteristica', category: 'combattimento', note: 'Si tira per tentare qualcosa.' },
  { en: 'Attack Roll', it: 'Tiro per colpire', category: 'combattimento' },
  { en: 'Advantage', it: 'Vantaggio', category: 'combattimento', note: 'Tira 2d20 e tieni il più alto.' },
  { en: 'Disadvantage', it: 'Svantaggio', category: 'combattimento', note: 'Tira 2d20 e tieni il più basso.' },
  { en: 'Proficiency Bonus', it: 'Bonus di competenza', category: 'combattimento', note: 'Da +2 a +6, sale col livello.' },
  { en: 'Challenge Rating (CR)', it: 'Grado di Sfida (GS)', category: 'combattimento', note: 'Quanto è pericoloso un mostro.' },
  { en: 'Initiative', it: 'Iniziativa', category: 'combattimento', note: 'Ordine dei turni: 1d20 + mod. Destrezza.' },
  { en: 'Passive Perception', it: 'Percezione passiva', category: 'combattimento', note: '10 + mod. Saggezza (+ competenza). Quanto nota senza cercare.' },
  { en: 'Concentration', it: 'Concentrazione', category: 'combattimento', note: 'Un solo incantesimo alla volta; si perde se si subiscono danni e si fallisce il TS.' },
  { en: 'Death Saving Throw', it: 'Tiro salvezza contro morte', category: 'combattimento', note: 'A 0 PF: tre successi si è stabili, tre fallimenti si muore.' },
  { en: 'Legendary Action', it: 'Azione leggendaria', category: 'combattimento', note: 'Il mostro agisce anche fuori dal proprio turno.' },
  { en: 'Lair Action', it: 'Azione di tana', category: 'combattimento', note: 'Effetto che scatta al conteggio 20 dell’iniziativa, nella tana del mostro.' },
  { en: 'Opportunity Attack', it: 'Attacco di opportunità', category: 'combattimento', note: 'Reazione contro chi si allontana dalla tua portata.' },
  { en: 'Bonus Action', it: 'Azione bonus', category: 'combattimento' },
  { en: 'Reaction', it: 'Reazione', category: 'combattimento', note: 'Una sola per round, anche nel turno altrui.' },
  { en: 'Short Rest', it: 'Riposo breve', category: 'combattimento', note: 'Almeno 1 ora.' },
  { en: 'Long Rest', it: 'Riposo lungo', category: 'combattimento', note: 'Almeno 8 ore.' },
  { en: 'Cover', it: 'Copertura', category: 'combattimento', note: 'Parziale +2 CA, superiore +5 CA, totale non bersagliabile.' },
  { en: 'Difficulty Class (DC)', it: 'Classe Difficoltà (CD)', category: 'combattimento', note: 'Il numero da raggiungere con il tiro.' },

  // ── Tipi di danno ───────────────────────────────────────────────
  { en: 'Acid', it: 'Acido', category: 'danno' },
  { en: 'Bludgeoning', it: 'Contundente', category: 'danno' },
  { en: 'Cold', it: 'Freddo', category: 'danno' },
  { en: 'Fire', it: 'Fuoco', category: 'danno' },
  { en: 'Force', it: 'Forza', category: 'danno' },
  { en: 'Lightning', it: 'Fulmine', category: 'danno' },
  { en: 'Necrotic', it: 'Necrotico', category: 'danno' },
  { en: 'Piercing', it: 'Perforante', category: 'danno' },
  { en: 'Poison', it: 'Veleno', category: 'danno' },
  { en: 'Psychic', it: 'Psichico', category: 'danno' },
  { en: 'Radiant', it: 'Radiante', category: 'danno' },
  { en: 'Slashing', it: 'Tagliente', category: 'danno' },
  { en: 'Thunder', it: 'Tuono', category: 'danno' },

  // ── Termini di gioco ────────────────────────────────────────────
  { en: 'Dungeon Master (DM)', it: 'Dungeon Master / Master', category: 'gioco', note: 'Tu.' },
  { en: 'Player Character (PC)', it: 'Personaggio Giocante (PG)', category: 'gioco' },
  { en: 'Non-Player Character (NPC)', it: 'Personaggio Non Giocante (PNG)', category: 'gioco' },
  { en: 'Party', it: 'Gruppo / compagnia', category: 'gioco' },
  { en: 'Encounter', it: 'Scontro / incontro', category: 'gioco' },
  { en: 'Stat Block', it: 'Blocco delle statistiche', category: 'gioco' },
  { en: 'Spell Slot', it: 'Slot incantesimo', category: 'gioco' },
  { en: 'Cantrip', it: 'Trucchetto', category: 'gioco', note: 'Incantesimo di livello 0: si lancia senza consumare slot.' },
  { en: 'Ritual', it: 'Rituale', category: 'gioco', note: 'Si può lanciare in 10 minuti in più senza consumare lo slot.' },
  { en: 'Spellcasting Ability', it: 'Caratteristica da incantatore', category: 'gioco' },
  { en: 'Attunement', it: 'Sintonia', category: 'gioco', note: 'Alcuni oggetti magici richiedono un riposo breve per sintonizzarsi. Massimo 3 per personaggio.' },
];

/** Cerca un termine per nome inglese o italiano. Usato anche dalla pagina delle regole. */
export function findTerm(name: string): GlossaryTerm | undefined {
  const needle = normalizeForSearch(name);
  return GLOSSARY.find(
    (term) => normalizeForSearch(term.en) === needle || normalizeForSearch(term.it) === needle,
  );
}

/** Toglie le parentesi esplicative: "Armor Class (AC)" → "Armor Class". */
function bareTerm(term: string): string {
  return term.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Espande una ricerca italiana con i corrispondenti inglesi.
 *
 * **Perché serve.** L'interfaccia è in italiano ma i dati SRD sono in inglese: un DM che
 * cerca «copertura» nelle regole non troverebbe nulla, perché la sezione si chiama *Cover*.
 * Senza questo, il glossario resterebbe una pagina da consultare a parte invece di
 * rendere utile la ricerca dove serve davvero.
 *
 * Espandere può solo **aggiungere** risultati, mai toglierne: la stringa originale
 * resta sempre fra i termini cercati.
 */
export function expandQuery(query: string): string[] {
  const needle = normalizeForSearch(query.trim());
  if (needle.length < 2) return [query];

  const terms = new Set<string>([query]);
  for (const term of GLOSSARY) {
    if (normalizeForSearch(term.it).includes(needle)) {
      terms.add(bareTerm(term.en));
    }
  }
  return [...terms];
}
