import { GLOSSARY } from '@/lib/glossary';

/**
 * Le 15 condizioni SRD, col nome italiano (che è ciò che finisce nel registro) e la sintesi
 * del glossario, così il DM ha la regola a portata senza cambiare pagina (SPEC-0007 AC9).
 */
export const CONDITIONS = GLOSSARY.filter((term) => term.category === 'condizione').map((term) => ({
  key: term.it.toLowerCase(),
  label: term.it,
  en: term.en,
  note: term.note ?? '',
}));
