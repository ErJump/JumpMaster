import { EmptyState } from '@/ui/components/primitives';

export default function BestiaryIndexPage() {
  return (
    <EmptyState
      icon="🐉"
      title="Scegli una creatura"
      description="Cerca per nome oppure filtra per grado di sfida. Premi / in qualsiasi momento per tornare alla ricerca."
    />
  );
}
