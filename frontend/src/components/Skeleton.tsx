export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton" role="status" aria-live="polite">
      <span className="visually-hidden">Loading…</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{ width: `${90 - i * 10}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
