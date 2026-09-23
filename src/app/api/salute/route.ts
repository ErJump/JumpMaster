/** Risponde l'avviatore (`npm run app`): riconosce il suo server, e non un altro programma sulla stessa porta. */
export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json({ app: 'jumpmaster' });
}
