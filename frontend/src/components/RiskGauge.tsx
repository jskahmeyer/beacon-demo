export function RiskGauge({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 10) * 10;
  const color =
    score >= 7 ? "var(--gauge-high)" : score >= 4 ? "var(--gauge-moderate)" : "var(--gauge-low)";

  return (
    <div
      className="gauge"
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-label={`Risk score ${score} out of 10`}
    >
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="gauge-label" aria-hidden="true">
        {score}/10
      </span>
    </div>
  );
}
