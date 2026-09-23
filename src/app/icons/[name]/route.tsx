/**
 * Le icone del manifest: `192.png`, `512.png`, `maskable-512.png` (SPEC-0017). Generate al volo,
 * poi il browser le tiene in cache.
 */
import { ImageResponse } from 'next/og';
import { BrandIcon } from '@/ui/brand-icon';

const ICONS: Record<string, { size: number; maskable: boolean }> = {
  '192.png': { size: 192, maskable: false },
  '512.png': { size: 512, maskable: false },
  'maskable-512.png': { size: 512, maskable: true },
};

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }): Promise<Response> {
  const icon = ICONS[(await params).name];
  if (!icon) return new Response('Non trovato', { status: 404 });
  return new ImageResponse(<BrandIcon size={icon.size} maskable={icon.maskable} />, {
    width: icon.size,
    height: icon.size,
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
