/**
 * Le route non hanno i controlli d'origine delle Server Actions. Quelle che scrivono nel database
 * accettano una richiesta solo dalla pagina dell'app stessa: una pagina web qualunque, aperta nello
 * stesso browser, non deve poter importare o scaricare nulla sul PC del DM.
 *
 * I browser mandano sempre `Origin` nelle POST; se manca (curl, script locali) la richiesta
 * non viene da una pagina web.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}
