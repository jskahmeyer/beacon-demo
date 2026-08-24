export interface SiteMetrics {
  id: string;
  name: string;
  missedCheckIns: number;
  daysSinceLastAssessment: number;
  incidentCount90d: number;
  staffingTurnoverPct: number;
  baselineTier: "low" | "moderate" | "high";
  lastAssessment?: RiskAssessment;
  lastSummary?: string;
  lastAssessedAt?: string;
  actionStatus?: "flagged" | "acknowledged" | "resolved";
  actionUpdatedAt?: string;
}

export interface RiskAssessment {
  riskScore: number;
  tier: "low" | "moderate" | "high";
  rationale: string;
  flaggedFactors: string[];
}

export interface RiskAssessmentResponse extends RiskAssessment {
  assessedAt: string;
}
