'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { featuresByGroup } from '@/features/registry';

/**
 * Navigazione generata dal registro delle feature: aggiungere una voce qui
 * non richiede di toccare questo file (ADR-0004).
 */
export function Navigation() {
  const pathname = usePathname();
  const groups = featuresByGroup();

  return (
    <nav aria-label="Sezioni" className="space-y-6">
      {groups.map(({ group, label, features }) => (
        <div key={group}>
          <h2 className="small-caps text-ink-faint mb-2 px-3 text-sm font-semibold">{label}</h2>
          <ul className="space-y-0.5">
            {features.map((feature) => {
              const isActive = pathname === feature.href || pathname.startsWith(`${feature.href}/`);
              return (
                <li key={feature.id}>
                  <Link
                    href={feature.href}
                    title={feature.description}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2.5 rounded-xs px-3 py-2 text-base transition-colors ${
                      isActive
                        ? 'bg-gold/15 text-gold border-gold border-l-2'
                        : 'text-ink-soft hover:bg-surface-raised hover:text-ink border-l-2 border-transparent'
                    }`}
                  >
                    <span aria-hidden className="text-lg">
                      {feature.icon}
                    </span>
                    {feature.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
