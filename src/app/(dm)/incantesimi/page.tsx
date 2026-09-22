import { EmptyState } from '@/ui/components/primitives';

export default function SpellsIndexPage() {
  return (
    <EmptyState
      icon="✨"
      title="Scegli un incantesimo"
      description="Cerca per nome oppure filtra per livello e scuola. Premi / per tornare alla ricerca."
    />
  );
}
