import type { Metadata, Viewport } from 'next';
import { Cinzel, EB_Garamond, JetBrains_Mono } from 'next/font/google';
import '@/ui/theme.css';

// next/font auto-ospita i font in fase di build: a runtime l'app non fa
// nessuna richiesta a Google. Requisito offline (AGENTS.md §5).
const display = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--jm-font-display',
  display: 'swap',
});

const body = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--jm-font-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--jm-font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JumpMaster',
  description: "Il compagno di avventure del Dungeon Master. D&D 5e, in locale, senza rete.",
  applicationName: 'JumpMaster',
};

export const viewport: Viewport = {
  themeColor: '#14100c',
};

/**
 * Applica il tema prima della prima pittura, altrimenti chi usa la palette chiara
 * vedrebbe un lampo scuro a ogni caricamento.
 */
const NO_FLASH = `(function(){try{var t=localStorage.getItem('jm-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}>{children}</body>
    </html>
  );
}
