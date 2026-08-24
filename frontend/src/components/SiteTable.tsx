import { SiteMetrics } from "../types";
import { RiskBadge } from "./RiskBadge";
import { ActionBadge } from "./ActionBadge";

export function SiteTable({
  sites,
  selectedId,
  onSelect,
}: {
  sites: SiteMetrics[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="table-scroll">
      <table className="site-table">
        <thead>
          <tr>
            <th>Site</th>
            <th>Missed Check-ins</th>
            <th>Days Since Assessment</th>
            <th>Incidents (90d)</th>
            <th>Staff Turnover</th>
            <th>Baseline Risk</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr
              key={site.id}
              className={site.id === selectedId ? "selected" : ""}
              onClick={() => onSelect(site.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(site.id);
                }
              }}
              tabIndex={0}
              aria-selected={site.id === selectedId}
            >
              <td>{site.name}</td>
              <td>{site.missedCheckIns}</td>
              <td>{site.daysSinceLastAssessment}</td>
              <td>{site.incidentCount90d}</td>
              <td>{site.staffingTurnoverPct}%</td>
              <td>
                <RiskBadge tier={site.baselineTier} />
              </td>
              <td>
                {site.actionStatus ? (
                  <ActionBadge status={site.actionStatus} />
                ) : (
                  <span className="no-action">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
