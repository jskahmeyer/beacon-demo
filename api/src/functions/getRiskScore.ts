import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSitesContainer } from "../data/cosmosClient";
import { getRiskAssessment } from "../llm/llmClient";
import { SiteMetrics } from "../types";

app.http("getRiskScore", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "sites/{id}/risk-score",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const id = request.params.id;
    const force = request.query.get("force") === "true";
    try {
      const container = getSitesContainer();
      const { resource: site } = await container.item(id, id).read<SiteMetrics>();
      if (!site) return { status: 404, jsonBody: { error: "Site not found." } };

      if (!force && site.lastAssessment && site.lastAssessedAt) {
        return { jsonBody: { ...site.lastAssessment, assessedAt: site.lastAssessedAt } };
      }

      const assessment = await getRiskAssessment(site);
      const assessedAt = new Date().toISOString();
      // patch (not replace) — streamSummary writes /lastSummary to the same
      // document independently and roughly concurrently; a full-document
      // replace based on a stale read would risk clobbering that write.
      await container.item(id, id).patch([
        { op: "set", path: "/lastAssessment", value: assessment },
        { op: "set", path: "/lastAssessedAt", value: assessedAt },
      ]);

      return { jsonBody: { ...assessment, assessedAt } };
    } catch (err) {
      context.error("getRiskScore failed", err);
      return { status: 500, jsonBody: { error: "Failed to generate risk assessment." } };
    }
  },
});
