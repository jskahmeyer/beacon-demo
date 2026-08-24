import { useEffect, useRef, useState } from "react";
import { SiteMetrics, RiskAssessmentResponse } from "../types";
import { fetchRiskScore, streamSummary } from "../api";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import { RiskGauge } from "./RiskGauge";
import { RiskBadge } from "./RiskBadge";
import { Skeleton } from "./Skeleton";

export function SiteDetail({ site }: { site: SiteMetrics }) {
  const [assessment, setAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryDone, setSummaryDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopStreamingRef = useRef<(() => void) | null>(null);

  const loadAssessment = (force: boolean) =>
    fetchRiskScore(site.id, { force })
      .then(setAssessment)
      .catch(() => setError("Couldn't generate a risk assessment."));

  const loadSummary = (force: boolean) => {
    stopStreamingRef.current?.();
    setSummaryDone(false);
    let firstToken = true;

    stopStreamingRef.current = streamSummary(
      site.id,
      (token) => {
        // On rerun, replace the old summary with the first new token instead
        // of appending, so stale content doesn't linger mid-sentence — but
        // don't blank it out before the new stream starts, to avoid a flash
        // of the skeleton for content we're about to replace anyway.
        // isFirst is captured synchronously here, not read inside the
        // setSummary updater — React applies updaters lazily, and if the
        // EventSource delivers several tokens in the same synchronous burst,
        // every updater would otherwise see firstToken as already flipped
        // to false by the time any of them actually runs.
        const isFirst = firstToken;
        firstToken = false;
        setSummary((prev) => (isFirst ? token : prev + token));
      },
      () => setSummaryDone(true),
      (message) => setError(message),
      { force }
    );
  };

  useEffect(() => {
    setAssessment(null);
    setAssessmentLoading(true);
    setSummary("");
    setError(null);

    loadAssessment(false).finally(() => setAssessmentLoading(false));
    loadSummary(false);

    return () => stopStreamingRef.current?.();
  }, [site.id]);

  const handleRerun = () => {
    setRerunning(true);
    setError(null);
    loadAssessment(true).finally(() => setRerunning(false));
    loadSummary(true);
  };

  return (
    <div className="site-detail">
      <h2>{site.name}</h2>

      {assessment && (
        <div className="assessment-meta">
          <span className="assessed-at">Last assessed {formatRelativeTime(assessment.assessedAt)}</span>
          <button
            type="button"
            className="rerun-button"
            onClick={handleRerun}
            disabled={rerunning || assessmentLoading}
          >
            {rerunning ? "Re-running…" : "Re-run assessment"}
          </button>
        </div>
      )}

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
