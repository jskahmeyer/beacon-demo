import { useEffect, useRef, useState } from "react";
import { SiteMetrics, RiskAssessmentResponse } from "../types";
import { fetchRiskScore, streamSummary, updateSiteAction } from "../api";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import { RiskGauge } from "./RiskGauge";
import { RiskBadge } from "./RiskBadge";
import { ActionBadge } from "./ActionBadge";
import { Skeleton } from "./Skeleton";
import { RefreshIcon, FlagIcon, CheckIcon, CheckCircleIcon } from "./icons";

type ActionStatus = NonNullable<SiteMetrics["actionStatus"]>;

// Mirrors the server-side rule in api/src/functions/updateSiteAction.ts —
// "resolved" cycles back to "flagged" so a site can always be reopened
// manually if new problems come up later.
const NEXT_ACTION: Partial<Record<ActionStatus, ActionStatus>> = {
  flagged: "acknowledged",
  acknowledged: "resolved",
  resolved: "flagged",
};

// Keyed by the status the button would move *to* (nextAction), not the
// current status — e.g. when nextAction is "acknowledged" the button
// reads "Acknowledge". "flagged" here is reached only from "resolved"
// (the fresh-flag case has its own separate "Flag for follow-up" prompt
// below), so it reads "Reopen" instead.
const ACTION_BUTTON_LABEL: Record<ActionStatus, string> = {
  flagged: "Reopen",
  acknowledged: "Acknowledge",
  resolved: "Mark resolved",
};

export function SiteDetail({
  site,
  onActionUpdate,
}: {
  site: SiteMetrics;
  onActionUpdate: (siteId: string, actionStatus: SiteMetrics["actionStatus"], actionUpdatedAt: string) => void;
}) {
  const [assessment, setAssessment] = useState<RiskAssessmentResponse | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryDone, setSummaryDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stopStreamingRef = useRef<(() => void) | null>(null);

  // isStale defaults to "never" for direct user-triggered calls (rerun),
  // which are already protected against overlap by their disabled buttons.
  // The mount/site-change effect below passes a real check, since React 18
  // StrictMode double-invokes effects in dev — without a staleness guard,
  // both invocations' fetches resolve and race to call setAssessment,
  // which is exactly the kind of bug StrictMode's double-invoke exists to
  // surface.
  const loadAssessment = (force: boolean, isStale: () => boolean = () => false) =>
    fetchRiskScore(site.id, { force })
      .then((data) => {
        if (!isStale()) setAssessment(data);
      })
      .catch(() => {
        if (!isStale()) setError("Couldn't generate a risk assessment.");
      });

  const loadSummary = (force: boolean, isStale: () => boolean = () => false) => {
    stopStreamingRef.current?.();
    setSummaryDone(false);
    let firstToken = true;

    stopStreamingRef.current = streamSummary(
      site.id,
      (token) => {
        if (isStale()) return;
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
      () => {
        if (!isStale()) setSummaryDone(true);
      },
      (message) => {
        if (!isStale()) setError(message);
      },
      { force }
    );
  };

  useEffect(() => {
    let stale = false;
    const isStale = () => stale;

    setAssessment(null);
    setAssessmentLoading(true);
    setSummary("");
    setError(null);

    loadAssessment(false, isStale).finally(() => {
      if (!isStale()) setAssessmentLoading(false);
    });
    loadSummary(false, isStale);

    return () => {
      stale = true;
      stopStreamingRef.current?.();
    };
  }, [site.id]);

  const handleRerun = () => {
    setRerunning(true);
    setError(null);
    loadAssessment(true).finally(() => setRerunning(false));
    loadSummary(true);
  };

  const handleAction = (status: ActionStatus) => {
    setActionPending(true);
    setError(null);
    updateSiteAction(site.id, status)
      .then(({ actionStatus, actionUpdatedAt }) => onActionUpdate(site.id, actionStatus, actionUpdatedAt))
      .catch(() => setError("Couldn't update the follow-up action."))
      .finally(() => setActionPending(false));
  };

  const nextAction = site.actionStatus ? NEXT_ACTION[site.actionStatus] : "flagged";

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
            <RefreshIcon className={`btn-icon${rerunning ? " btn-icon-spin" : ""}`} />
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

      {!assessmentLoading && assessment && (assessment.tier === "high" || site.actionStatus) && (
        <section>
          <h3>Follow-up Action</h3>
          <div className="action-card">
            {site.actionStatus ? (
              <>
                <div className="action-status-row">
                  <ActionBadge status={site.actionStatus} />
                  {site.actionUpdatedAt && (
                    <span className="assessed-at">{formatRelativeTime(site.actionUpdatedAt)}</span>
                  )}
                </div>
                {nextAction && (
                  <button
                    type="button"
                    className="rerun-button"
                    onClick={() => handleAction(nextAction)}
                    disabled={actionPending}
                  >
                    {nextAction === "resolved" ? (
                      <CheckCircleIcon className="btn-icon" />
                    ) : nextAction === "flagged" ? (
                      <FlagIcon className="btn-icon" />
                    ) : (
                      <CheckIcon className="btn-icon" />
                    )}
                    {actionPending ? "Updating…" : ACTION_BUTTON_LABEL[nextAction]}
                  </button>
                )}
              </>
            ) : (
              <>
                <p>This site is flagged as high risk by the latest assessment.</p>
                <button
                  type="button"
                  className="rerun-button"
                  onClick={() => handleAction("flagged")}
                  disabled={actionPending}
                >
                  <FlagIcon className="btn-icon" />
                  {actionPending ? "Flagging…" : "Flag for follow-up"}
                </button>
              </>
            )}
          </div>
        </section>
      )}

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
