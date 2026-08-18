import { SiteMetrics } from "../types";

type Tier = SiteMetrics["baselineTier"];

const TIER_STYLES: Record<Tier, string> = {
  low: "badge badge-low",
  moderate: "badge badge-moderate",
  high: "badge badge-high",
};

export function RiskBadge({ tier }: { tier: Tier }) {
  return <span className={TIER_STYLES[tier]}>{tier.toUpperCase()}</span>;
}
