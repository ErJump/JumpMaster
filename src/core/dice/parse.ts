/**
 * Parser della notazione dei dadi.
 *
 * Scritto a mano di proposito: la grammatica è minuscola e chiusa, un parser
 * ricorsivo-discendente la copre tutta restando leggibile e permette messaggi d'errore
 * **in italiano scritti su misura**. Vedi SPEC-0004 design.
 *
 *   expr     := term (('+' | '-') term)* ('/' numero)?
 *   term     := dadi | numero
 *   dadi     := [quantità] 'd' (facce | '%') [tieni]
 *   tieni    := ('kh' | 'kl' | 'dh' | 'dl') [quantità]
 */
import type { DiceExpression, KeepMode, Term } from './types';

export class DiceParseError extends Error {
  override readonly name = 'DiceParseError';
}

/** Limiti di buon senso: oltre questi è quasi certamente un errore di battitura (SPEC-0004 AC10). */
export const MAX_DICE = 100;
export const MAX_FACES = 1000;

const KEEP_MODES: readonly KeepMode[] = ['kh', 'kl', 'dh', 'dl'];

export function parseDice(input: string): DiceExpression {
  const src = input.toLowerCase().replace(/\s+/g, '');
  if (src === '') {
    throw new DiceParseError('Scrivi un tiro, per esempio 1d20+5.');
  }

  let cursor = 0;
  const terms: Term[] = [];
  let divisor = 1;

  const peek = (): string | undefined => src[cursor];

  function readInteger(what: string): number {
    const start = cursor;
    while (cursor < src.length && src[cursor]! >= '0' && src[cursor]! <= '9') cursor++;
    if (cursor === start) {
      throw new DiceParseError(`Mi aspettavo ${what} dopo "${src.slice(0, start)}".`);
    }
    return Number(src.slice(start, cursor));
  }

  function readTerm(sign: 1 | -1): Term {
    // Quantità di dadi opzionale: "d20" equivale a "1d20".
    let count = 1;
    let hasExplicitCount = false;
    if (peek() !== undefined && peek()! >= '0' && peek()! <= '9') {
      count = readInteger('un numero');
      hasExplicitCount = true;
    }

    if (peek() !== 'd') {
      if (!hasExplicitCount) {
        throw new DiceParseError(`Non riesco a leggere "${src}". Usa una notazione come 1d20+5 o 4d6kh3.`);
      }
      return { kind: 'constant', sign, value: count };
    }

    cursor++; // consuma la 'd'

    // "d%" è un altro modo di scrivere "d100".
    let faces: number;
    if (peek() === '%') {
      cursor++;
      faces = 100;
    } else {
      faces = readInteger('il numero di facce del dado');
    }

    if (count < 1) throw new DiceParseError('Serve almeno un dado.');
    if (count > MAX_DICE) throw new DiceParseError(`Troppi dadi: il massimo è ${MAX_DICE}.`);
    if (faces < 2) throw new DiceParseError('Un dado deve avere almeno 2 facce.');
    if (faces > MAX_FACES) throw new DiceParseError(`Troppe facce: il massimo è ${MAX_FACES}.`);

    const keep = readKeep(count);
    return { kind: 'dice', sign, count, faces, keep };
  }

  function readKeep(diceCount: number): DiceTermKeep {
    const mode = KEEP_MODES.find((candidate) => src.startsWith(candidate, cursor));
    if (!mode) return null;
    cursor += mode.length;

    // "kh" da solo vale "kh1": è la forma che si digita più spesso.
    let amount = 1;
    if (peek() !== undefined && peek()! >= '0' && peek()! <= '9') {
      amount = readInteger('un numero');
    }

    if (amount < 1) {
      throw new DiceParseError(`"${mode}" richiede almeno 1 dado.`);
    }
    if (amount >= diceCount && (mode === 'kh' || mode === 'kl')) {
      throw new DiceParseError(
        `Stai tirando ${diceCount} dadi e ne vuoi tenere ${amount}: non ha effetto. Usa un numero più basso.`,
      );
    }
    if (amount >= diceCount && (mode === 'dh' || mode === 'dl')) {
      throw new DiceParseError(`Stai tirando ${diceCount} dadi e ne vuoi scartare ${amount}: non ne resterebbe nessuno.`);
    }

    return { mode, count: amount };
  }

  let sign: 1 | -1 = 1;
  if (peek() === '+' || peek() === '-') {
    sign = peek() === '-' ? -1 : 1;
    cursor++;
  }

  for (;;) {
    terms.push(readTerm(sign));

    if (cursor >= src.length) break;

    const next = peek();
    if (next === '+' || next === '-') {
      sign = next === '-' ? -1 : 1;
      cursor++;
      continue;
    }
    if (next === '/') {
      cursor++;
      divisor = readInteger('un numero dopo la barra');
      if (divisor === 0) throw new DiceParseError('Non posso dividere per zero.');
      if (cursor < src.length) {
        throw new DiceParseError(`Non capisco "${src.slice(cursor)}" alla fine del tiro.`);
      }
      break;
    }
    throw new DiceParseError(`Non capisco "${src.slice(cursor)}" nel tiro.`);
  }

  return { notation: formatExpression(terms, divisor), terms, divisor };
}

type DiceTermKeep = { mode: KeepMode; count: number } | null;

function formatExpression(terms: Term[], divisor: number): string {
  const body = terms
    .map((term, position) => {
      const sign = term.sign === -1 ? '-' : position === 0 ? '' : '+';
      if (term.kind === 'constant') return `${sign}${term.value}`;
      const keep = term.keep ? `${term.keep.mode}${term.keep.count}` : '';
      return `${sign}${term.count}d${term.faces}${keep}`;
    })
    .join('');
  return divisor === 1 ? body : `${body}/${divisor}`;
}
