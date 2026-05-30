export function ColorIndicator({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2.5" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
