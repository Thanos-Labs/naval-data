export function SectionHeader({ label, count }: { label: string; count?: string | number }) {
  return (
    <div className="flex items-center gap-3 py-2 text-[11px] tracking-tui uppercase text-muted-foreground">
      <span className="shrink-0">{label}</span>
      <span className="h-px flex-1 bg-border" />
      {count !== undefined && <span className="text-accent shrink-0">{count}</span>}
    </div>
  );
}
