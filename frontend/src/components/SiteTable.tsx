import { SiteMetrics } from "../types";
import { RiskBadge } from "./RiskBadge";

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
    <table className="site-table">
      <thead>
        <tr>
          <th>Site</th>
          <th>Missed Check-ins</th>
          <th>Days Since Assessment</th>
          <th>Incidents (90d)</th>
          <th>Staff Turnover</th>
          <th>Baseline Risk</th>
        </tr>
      </thead>
      <tbody>
        {sites.map((site) => (
          <tr
            key={site.id}
            className={site.id === selectedId ? "selected" : ""}
            onClick={() => onSelect(site.id)}
          >
            <td>{site.name}</td>
            <td>{site.missedCheckIns}</td>
            <td>{site.daysSinceLastAssessment}</td>
            <td>{site.incidentCount90d}</td>
            <td>{site.staffingTurnoverPct}%</td>
            <td>
              <RiskBadge tier={site.baselineTier} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
