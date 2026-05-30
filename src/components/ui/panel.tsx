import type * as React from 'react';
import { cn } from '../../lib/utils';

export function Panel({
  title,
  count,
  className,
  children,
  action,
}: {
  title?: string;
  count?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn('border border-border bg-card backdrop-blur-sm', className)}>
      {(title || count !== undefined || action) && (
        <header className="flex items-center justify-between border-b border-border px-3 py-2 text-[11px] tracking-tui uppercase text-muted-foreground">
          <span className="flex items-center gap-2">{title && <span>{title}</span>}</span>
          <span className="flex items-center gap-3">
            {action}
            {count !== undefined && <span className="text-accent">{count}</span>}
          </span>
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}
