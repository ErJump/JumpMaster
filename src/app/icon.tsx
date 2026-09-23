import { ImageResponse } from 'next/og';
import { BrandIcon } from '@/ui/brand-icon';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

/** L'icona della scheda del browser (SPEC-0017 AC1). */
export default function Icon() {
  return new ImageResponse(<BrandIcon size={64} />, size);
}
