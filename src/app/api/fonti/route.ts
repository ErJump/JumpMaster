/** Il catalogo dei manuali disponibili su Open5e. La pagina lo chiede dopo essersi mostrata. */
import { availableSources } from '@/features/sources/server';

export const runtime = 'nodejs';

export async function GET(): Promise<Response> {
  return Response.json(await availableSources(), { headers: { 'Cache-Control': 'no-store' } });
}
