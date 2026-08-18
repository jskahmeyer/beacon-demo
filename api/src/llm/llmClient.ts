import Anthropic from "@anthropic-ai/sdk";
import { SiteMetrics, RiskAssessment } from "../types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const riskAssessmentTool: Anthropic.Tool = {
  name: "submit_risk_assessment",
  description: "Submit a structured risk assessment for a program site.",
  input_schema: {
    type: "object",
    properties: {
      riskScore: { type: "integer", minimum: 1, maximum: 10 },
      tier: { type: "string", enum: ["low", "moderate", "high"] },
      rationale: { type: "string", description: "One sentence explaining the score." },
      flaggedFactors: { type: "array", items: { type: "string" } },
    },
    required: ["riskScore", "tier", "rationale", "flaggedFactors"],
  },
};

export async function getRiskAssessment(site: SiteMetrics): Promise<RiskAssessment> {
  const prompt = buildPrompt(site);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 500,
    tools: [riskAssessmentTool],
    tool_choice: { type: "tool", name: "submit_risk_assessment" },
    messages: [{ role: "user", content: prompt }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Model did not return a structured risk assessment.");
  }

  return toolUse.input as RiskAssessment;
}

export async function* streamNarrativeSummary(site: SiteMetrics): AsyncGenerator<string> {
  const prompt =
    buildPrompt(site) +
    "\n\nWrite a short (3-4 sentence) plain-language narrative summary of this site's current status for a program manager, in prose, not a list.";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

function buildPrompt(site: SiteMetrics): string {
  return `You are assisting a clinical operations dashboard for a behavioral health provider.
This is entirely synthetic demo data - no real individuals are involved.

Site: ${site.name}
Missed check-ins (last 30 days): ${site.missedCheckIns}
Days since last required assessment: ${site.daysSinceLastAssessment}
Incidents (last 90 days): ${site.incidentCount90d}
Staffing turnover: ${site.staffingTurnoverPct}%`;
}
