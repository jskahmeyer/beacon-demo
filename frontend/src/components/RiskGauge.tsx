export function RiskGauge({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 10) * 10;
  const color =
    score >= 7 ? "var(--gauge-high)" : score >= 4 ? "var(--gauge-moderate)" : "var(--gauge-low)";

  return (
    <div className="gauge">
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="gauge-label">{score}/10</span>
    </div>
  );
}
