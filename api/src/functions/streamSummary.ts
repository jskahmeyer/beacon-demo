import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSitesContainer } from "../data/cosmosClient";
import { streamNarrativeSummary } from "../llm/llmClient";
import { SiteMetrics } from "../types";

// NOTE: HTTP response streaming in the Azure Functions Node.js worker is a
// newer/preview capability. Enable it by setting
// AzureWebJobsFeatureFlags=EnableHttpStreaming in local.settings.json
// (and as an App Setting after deploying). If it's not available in your
// tooling version, see the non-streaming FALLBACK at the bottom of this file.

app.http("streamSummary", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "sites/{id}/summary/stream",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const id = request.params.id;
    const force = request.query.get("force") === "true";
    const container = getSitesContainer();
    const { resource: site } = await container.item(id, id).read<SiteMetrics>();

    if (!site) {
      return { status: 404, jsonBody: { error: "Site not found." } };
    }

    const encoder = new TextEncoder();

    const body = new ReadableStream({
      async start(controller) {
        try {
          if (!force && site.lastSummary) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: site.lastSummary })}\n\n`));
            controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
            return;
          }

          let fullText = "";
          for await (const chunk of streamNarrativeSummary(site as SiteMetrics)) {
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));

          // patch (not replace) — see the note in getRiskScore.ts.
          await container.item(id, id).patch([
            { op: "set", path: "/lastSummary", value: fullText },
            { op: "set", path: "/lastAssessedAt", value: new Date().toISOString() },
          ]);
        } catch (err) {
          context.error("streamSummary failed", err);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: "Stream failed." })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
      body,
    };
  },
});
