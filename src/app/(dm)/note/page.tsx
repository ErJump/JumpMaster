import { EmptyState } from '@/ui/components/primitives';
import { ButtonLink } from '@/ui/components/Button';

export default function NotesIndexPage() {
  return (
    <EmptyState
      icon="📜"
      title="Il taccuino della campagna"
      description="Scegli una nota a sinistra, oppure scrivine una. Dentro il testo, [[Titolo]] collega un'altra nota o un personaggio: la pagina citata saprà da sola chi la nomina."
      action={<ButtonLink href="/note/nuova">Scrivi una nota</ButtonLink>}
    />
  );
}
