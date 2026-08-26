export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="grid min-h-48 place-items-center">
      <div className="flex flex-col items-center gap-3 text-muted">
        <span className="size-9 animate-spin rounded-full border-2 border-border border-t-primary" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}
