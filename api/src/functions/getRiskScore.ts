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
    try {
      const container = getSitesContainer();
      const { resource: site } = await container.item(id, id).read<SiteMetrics>();
      if (!site) return { status: 404, jsonBody: { error: "Site not found." } };

      const assessment = await getRiskAssessment(site);
      return { jsonBody: assessment };
    } catch (err) {
      context.error("getRiskScore failed", err);
      return { status: 500, jsonBody: { error: "Failed to generate risk assessment." } };
    }
  },
});
