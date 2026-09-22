import { EmptyState } from '@/ui/components/primitives';

export default function ItemsIndexPage() {
  return (
    <EmptyState
      icon="⚱️"
      title="Scegli un oggetto"
      description="Oggetti magici ed equipaggiamento sono nello stesso elenco. Filtra per rarità o categoria, oppure premi / per cercare."
    />
  );
}
