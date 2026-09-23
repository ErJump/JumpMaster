import type { MetadataRoute } from 'next';

/** JumpMaster installabile come app (SPEC-0017 AC1): finestra sua, senza barra degli indirizzi. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JumpMaster',
    short_name: 'JumpMaster',
    description: 'Il compagno di avventure del Dungeon Master. D&D 5e, in locale, senza rete.',
    lang: 'it',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#14100c',
    theme_color: '#14100c',
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
