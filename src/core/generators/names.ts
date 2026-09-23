/**
 * Nomi per ascendenza, **costruiti per sillabe** (ADR-0011): non esiste una lista da cui sono
 * copiati, e ogni combinazione è nuova. Ogni ascendenza ha un suono suo, così un nome dice già
 * qualcosa di chi lo porta. ⚠ Modulo puro (invariante I1).
 */
import { capitalize, chance, pick, type Rng } from './random';

export const ANCESTRIES = ['umano', 'elfo', 'nano', 'halfling', 'gnomo', 'mezzorco', 'tiefling', 'dragonide'] as const;
export type Ancestry = (typeof ANCESTRIES)[number];

export const ANCESTRY_LABELS: Record<Ancestry, string> = {
  umano: 'Umano',
  elfo: 'Elfo',
  nano: 'Nano',
  halfling: 'Halfling',
  gnomo: 'Gnomo',
  mezzorco: 'Mezzorco',
  tiefling: 'Tiefling',
  dragonide: 'Dragonide',
};

interface NameStyle {
  starts: readonly string[];
  ends: readonly string[];
  /** Cognome, soprannome o clan. */
  family: (rng: Rng) => string | null;
}

const HUMAN_PLACES = [
  { word: 'Rocca', gender: 'f' }, { word: 'Monte', gender: 'm' }, { word: 'Valle', gender: 'f' }, { word: 'Ponte', gender: 'm' },
  { word: 'Fonte', gender: 'f' }, { word: 'Torre', gender: 'f' }, { word: 'Poggio', gender: 'm' }, { word: 'Selva', gender: 'f' },
] as const;

/** Con la forma maschile e femminile: il cognome deve concordare col luogo. */
const HUMAN_PLACE_ADJECTIVES = [
  { m: 'scuro', f: 'scura' }, { m: 'nero', f: 'nera' }, { m: 'alto', f: 'alta' }, { m: 'vecchio', f: 'vecchia' },
  { m: 'freddo', f: 'fredda' }, { m: 'rosso', f: 'rossa' }, { m: 'bianco', f: 'bianca' }, { m: 'verde', f: 'verde' },
] as const;

const compound = (a: readonly string[], b: readonly string[]) => (rng: Rng) => pick(rng, a) + pick(rng, b);

const STYLES: Record<Ancestry, NameStyle> = {
  umano: {
    starts: ['Al', 'Bar', 'Cor', 'Dar', 'El', 'Fen', 'Gal', 'Ald', 'Ir', 'Lor', 'Mar', 'Ner', 'Or', 'Per', 'Ros', 'Ser', 'Tam', 'Val', 'Brun', 'Ot'],
    ends: ['ric', 'ano', 'ello', 'ius', 'ard', 'en', 'a', 'ina', 'elle', 'issa', 'ia', 'ilde', 'aldo', 'ea'],
    // Cognomi di luogo, all'italiana, con l'aggettivo che concorda: Roccascura, Montenero.
    family: (rng) => {
      const place = pick(rng, HUMAN_PLACES);
      const adjective = pick(rng, HUMAN_PLACE_ADJECTIVES);
      return place.word + (place.gender === 'f' ? adjective.f : adjective.m);
    },
  },
  elfo: {
    starts: ['Ae', 'Ael', 'Cel', 'Eri', 'Fae', 'Gal', 'Il', 'Ith', 'Lae', 'Lir', 'Mir', 'Nae', 'Quel', 'Rae', 'Sil', 'Thal', 'Ve', 'Yl'],
    ends: ['ion', 'iel', 'wen', 'ath', 'ir', 'ys', 'anor', 'andra', 'essa', 'ari', 'enor', 'yth'],
    family: (rng) => `${pick(rng, ['Foglia', 'Stella', 'Luna', 'Rugiada', 'Vento', 'Ramo', 'Canto'])} ${pick(rng, ["d'argento", 'di brina', 'lucente', 'silente', "dell'alba", 'del crepuscolo'])}`,
  },
  nano: {
    starts: ['Bal', 'Bor', 'Dur', 'Dwal', 'Grun', 'Hald', 'Kil', 'Mor', 'Thor', 'Ulf', 'Brom', 'Gund', 'Dag', 'Hild'],
    ends: ['in', 'ak', 'grim', 'dal', 'rek', 'ur', 'a', 'hild', 'ra', 'ok', 'run'],
    // Solo complementi («di ferro»), che non devono concordare: «Barbaspezzato» sarebbe sbagliato.
    family: compound(['Barba', 'Pugno', 'Martello', 'Scudo', 'Incudine', 'Picco', 'Elmo'], ['diferro', 'dipietra', 'dibronzo', 'digranito', 'dargento', 'diroccia']),
  },
  halfling: {
    starts: ['Bil', 'Cor', 'Fer', 'Lil', 'Mer', 'Pip', 'Ros', 'Sam', 'Tom', 'Wil', 'Lob', 'Mil', 'Dod', 'Pan'],
    ends: ['bo', 'ry', 'do', 'la', 'lie', 'wick', 'ina', 'ella', 'kin', 'nie'],
    // Aggettivi invariabili: vanno bene sia con «Collina» sia con «Ruscello».
    family: compound(['Collina', 'Tana', 'Fiore', 'Zucca', 'Siepe', 'Mela', 'Ruscello'], ['verde', 'dolce', 'lieve', 'gentile', 'felice', 'grande']),
  },
  gnomo: {
    starts: ['Bim', 'Fiz', 'Glim', 'Nib', 'Pock', 'Quil', 'Tink', 'Wiz', 'Zook', 'Dim', 'Bree', 'Orl'],
    ends: ['ble', 'wick', 'bo', 'nock', 'sy', 'zel', 'ina', 'kle', 'ra', 'pip'],
    family: (rng) => `${pick(rng, ['Ingranaggio', 'Scintilla', 'Molla', 'Rotella', 'Bullone', 'Lente'])} ${pick(rng, ['lucente', 'fischiante', 'ribelle', 'sorridente', 'veloce', 'gentile'])}`,
  },
  mezzorco: {
    starts: ['Gru', 'Kar', 'Mug', 'Ogr', 'Sha', 'Thok', 'Urg', 'Vor', 'Zag', 'Bruk', 'Ghar', 'Yev'],
    ends: ['ash', 'gar', 'ok', 'ma', 'nak', 'ra', 'ug', 'ka', 'osh'],
    // I mezzorchi portano più spesso un soprannome guadagnato che un cognome.
    family: (rng) =>
      chance(rng, 0.7)
        ? pick(rng, ['lo Sfregiato', 'Zanna Spezzata', 'Mano di Pietra', 'il Silenzioso', 'Occhio Solo', 'Cuore di Lupo', 'la Montagna'])
        : null,
  },
  tiefling: {
    starts: ['Ak', 'Bar', 'Dam', 'Ka', 'Mor', 'Nem', 'Ori', 'Sker', 'Zev', 'Lera', 'Ma', 'Ira'],
    ends: ['akos', 'ai', 'ios', 'ith', 'eia', 'oz', 'ira', 'avel', 'une'],
    family: () => null,
  },
  dragonide: {
    starts: ['Ar', 'Bal', 'Dona', 'Ghe', 'Kri', 'Med', 'Nal', 'Pand', 'Rho', 'Sor', 'Tor', 'Vir'],
    ends: ['asar', 'jhan', 'ivia', 'esh', 'thra', 'vek', 'ora', 'ur', 'inn'],
    family: (rng) => `del clan ${pick(rng, ['Kerr', 'Myas', 'Nemm', 'Ophin', 'Yarj', 'Dely', 'Vath'])}${pick(rng, ['hylon', 'tor', 'onis', 'ra', 'erit', 'zan'])}`,
  },
};

/** Alcuni tiefling scelgono per sé il nome di un concetto: una virtù, o una condanna. */
const TIEFLING_CONCEPTS = ['Speranza', 'Pazienza', 'Tormento', 'Silenzio', 'Cenere', 'Clemenza', 'Rimorso', 'Brace', 'Promessa', 'Attesa'];

/** Evita tre lettere uguali di fila al punto di giunzione: «Ullla» non si legge. */
function joinSyllables(start: string, end: string): string {
  const name = start + end;
  return name.replace(/(.)\1\1+/gi, '$1$1');
}

export function generateName(rng: Rng, ancestry: Ancestry): { given: string; family: string | null; full: string } {
  const style = STYLES[ancestry];

  const given =
    ancestry === 'tiefling' && chance(rng, 0.35)
      ? pick(rng, TIEFLING_CONCEPTS)
      : capitalize(joinSyllables(pick(rng, style.starts), pick(rng, style.ends)).toLowerCase());

  const family = style.family(rng);
  return { given, family, full: family ? `${given} ${family}` : given };
}
