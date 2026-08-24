import { SiteMetrics, RiskAssessmentResponse } from "./types";

export async function fetchSites(): Promise<SiteMetrics[]> {
  const res = await fetch("/api/sites");
  if (!res.ok) throw new Error("Failed to load sites.");
  return res.json();
}

export async function fetchRiskScore(
  id: string,
  options?: { force?: boolean }
): Promise<RiskAssessmentResponse> {
  const query = options?.force ? "?force=true" : "";
  const res = await fetch(`/api/sites/${id}/risk-score${query}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to generate risk score.");
  return res.json();
}

export function streamSummary(
  id: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (message: string) => void,
  options?: { force?: boolean }
): () => void {
  const query = options?.force ? "?force=true" : "";
  const source = new EventSource(`/api/sites/${id}/summary/stream${query}`);

  source.onmessage = (event) => {
    const { token } = JSON.parse(event.data);
    onToken(token);
  };

  source.addEventListener("done", () => {
    onDone();
    source.close();
  });

  source.addEventListener("error", () => {
    onError("Something went wrong generating the summary.");
    source.close();
  });

  return () => source.close();
}
