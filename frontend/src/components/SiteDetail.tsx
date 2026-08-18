import { useEffect, useState } from "react";
import { SiteMetrics, RiskAssessment } from "../types";
import { fetchRiskScore, streamSummary } from "../api";
import { RiskGauge } from "./RiskGauge";
import { RiskBadge } from "./RiskBadge";
import { Skeleton } from "./Skeleton";

export function SiteDetail({ site }: { site: SiteMetrics }) {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [summaryDone, setSummaryDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAssessment(null);
    setAssessmentLoading(true);
    setSummary("");
    setSummaryDone(false);
    setError(null);

    fetchRiskScore(site.id)
      .then(setAssessment)
      .catch(() => setError("Couldn't generate a risk assessment."))
      .finally(() => setAssessmentLoading(false));

    const stopStreaming = streamSummary(
      site.id,
      (token) => setSummary((prev) => prev + token),
      () => setSummaryDone(true),
      (message) => setError(message)
    );

    return stopStreaming;
  }, [site.id]);

  return (
    <div className="site-detail">
      <h2>{site.name}</h2>

      {error && <p className="error">{error}</p>}

      <section>
        <h3>AI Risk Assessment</h3>
        {assessmentLoading ? (
          <Skeleton lines={2} />
        ) : assessment ? (
          <div className="risk-card">
            <RiskGauge score={assessment.riskScore} />
            <RiskBadge tier={assessment.tier} />
            <p>{assessment.rationale}</p>
            <div className="tags">
              {assessment.flaggedFactors.map((factor) => (
                <span key={factor} className="tag">
                  {factor}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section>
        <h3>AI Narrative Summary</h3>
        {summary ? (
          <p className="summary-text">
            {summary}
            {!summaryDone && <span className="cursor">▍</span>}
          </p>
        ) : (
          <Skeleton lines={3} />
        )}
      </section>
    </div>
  );
}
