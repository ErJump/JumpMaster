/** Esporta una campagna come file da scaricare (SPEC-0014). */
import { exportArchive } from '@/features/archive/server';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return new Response('Non trovato', { status: 404 });

  const file = await exportArchive(id);
  if (!file) return new Response('Non trovato', { status: 404 });

  return new Response(file.body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
