import type * as React from 'react';
import { cn } from '../../lib/utils';

export function Tag({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'danger' | 'stressed' | 'muted';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-1.5 py-0.5 text-[10px] tracking-tui uppercase',
        variant === 'default' && 'border-border text-foreground/80',
        variant === 'muted' && 'border-border/60 text-muted-foreground',
        variant === 'accent' && 'border-accent text-accent',
        variant === 'danger' && 'border-destructive text-destructive',
        variant === 'stressed' && 'border-destructive text-destructive tracking-[0.35em] pr-[2px]',
        className,
      )}
    >
      {children}
    </span>
  );
}
