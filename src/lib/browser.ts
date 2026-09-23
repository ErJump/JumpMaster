/**
 * Che browser è, per dire al DM come installare JumpMaster (SPEC-0017 AC8).
 * Opera e Firefox non installano le app web sul desktop; Edge, Chrome e simili sì; Safari le
 * aggiunge al Dock. L'ordine dei controlli conta: Opera ed Edge dichiarano anche «Chrome/».
 */
export type InstallableBrowser = 'safari' | 'chromium' | 'other';

export function classifyBrowser(userAgent: string): InstallableBrowser {
  if (/OPR\/|OPT\/|Firefox\/|FxiOS\//.test(userAgent)) return 'other';
  if (/Edg\/|Chrome\/|CriOS\//.test(userAgent)) return 'chromium';
  if (/Safari\//.test(userAgent)) return 'safari';
  return 'other';
}
