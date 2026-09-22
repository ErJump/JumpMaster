import { EmptyState } from '@/ui/components/primitives';

export default function RulesIndexPage() {
  return (
    <EmptyState
      icon="⚖️"
      title="«Si può fare?»"
      description="Scrivi cosa stai cercando: la ricerca guarda dentro il testo delle regole, non solo nei titoli. Prova con «copertura», «afferrare» o «privo di sensi»."
    />
  );
}
