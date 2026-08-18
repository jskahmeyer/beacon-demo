export interface SiteMetrics {
  id: string;
  name: string;
  missedCheckIns: number;
  daysSinceLastAssessment: number;
  incidentCount90d: number;
  staffingTurnoverPct: number;
  baselineTier: "low" | "moderate" | "high";
}

export interface RiskAssessment {
  riskScore: number;
  tier: "low" | "moderate" | "high";
  rationale: string;
  flaggedFactors: string[];
}
