import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

const VARIANTS = {
  primary:
    'border-gold/60 bg-gold/15 text-gold hover:bg-gold/25 hover:border-gold',
  ghost: 'border-border-strong text-ink-soft hover:text-ink hover:border-gold-soft',
  danger: 'border-wax/60 bg-wax/10 text-wax hover:bg-wax/20 hover:border-wax',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

const BASE =
  'small-caps inline-flex items-center justify-center gap-2 rounded-xs border px-4 py-2 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return (
    <button {...rest} className={`${BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  className = '',
  children,
}: {
  href: ComponentProps<typeof Link>['href'];
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTS[variant]} ${className}`}>
      {children}
    </Link>
  );
}
