import { ImageResponse } from 'next/og';
import { BrandIcon } from '@/ui/brand-icon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Safari la usa quando JumpMaster si aggiunge al Dock. */
export default function AppleIcon() {
  return new ImageResponse(<BrandIcon size={180} maskable />, size);
}
