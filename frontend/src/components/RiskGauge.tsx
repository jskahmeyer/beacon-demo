export function RiskGauge({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 10) * 10;
  const color = score >= 7 ? "#d9534f" : score >= 4 ? "#f0ad4e" : "#5cb85c";

  return (
    <div className="gauge">
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="gauge-label">{score}/10</span>
    </div>
  );
}
