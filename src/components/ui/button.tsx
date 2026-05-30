import type * as React from 'react';
import { cn } from '../../lib/utils';

export function Button({
  children,
  variant = 'default',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'accent' | 'ghost' }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center gap-2 border px-3 py-1.5 text-xs tracking-tui uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'default' && 'border-border bg-card text-foreground hover:bg-secondary',
        variant === 'accent' && 'border-accent text-accent hover:bg-accent-soft',
        variant === 'ghost' && 'border-transparent text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  );
}
