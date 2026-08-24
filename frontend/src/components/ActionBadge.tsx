import { SiteMetrics } from "../types";

type ActionStatus = NonNullable<SiteMetrics["actionStatus"]>;

const STATUS_STYLES: Record<ActionStatus, string> = {
  flagged: "badge badge-flagged",
  acknowledged: "badge badge-acknowledged",
  resolved: "badge badge-resolved",
};

export function ActionBadge({ status }: { status: ActionStatus }) {
  return <span className={STATUS_STYLES[status]}>{status.toUpperCase()}</span>;
}
