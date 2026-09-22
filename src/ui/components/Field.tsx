import type { ComponentProps, ReactNode } from 'react';

const CONTROL =
  'panel text-ink placeholder:text-ink-faint focus:border-gold-soft w-full px-3 py-2 text-base outline-none';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="small-caps text-gold mb-1 block text-base font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="text-ink-faint mt-1 block text-sm">{hint}</span>}
      {error && (
        <span role="alert" className="text-wax mt-1 block text-sm">
          {error}
        </span>
      )}
    </label>
  );
}

export function TextInput({ className = '', ...rest }: ComponentProps<'input'>) {
  return <input {...rest} className={`${CONTROL} ${className}`} />;
}

export function TextArea({ className = '', ...rest }: ComponentProps<'textarea'>) {
  return <textarea {...rest} className={`${CONTROL} resize-y ${className}`} />;
}

export function Select({ className = '', children, ...rest }: ComponentProps<'select'>) {
  return (
    <select {...rest} className={`${CONTROL} cursor-pointer ${className}`}>
      {children}
    </select>
  );
}
