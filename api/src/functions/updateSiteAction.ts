import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSitesContainer } from "../data/cosmosClient";
import { SiteMetrics } from "../types";
import { NEXT_STATUS, isValidTransition } from "../domain/actionWorkflow";

app.http("updateSiteAction", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "sites/{id}/action",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const id = request.params.id;
    try {
      const body = (await request.json()) as { status?: string };
      const status = body?.status;

      const container = getSitesContainer();
      const { resource: site } = await container.item(id, id).read<SiteMetrics>();
      if (!site) return { status: 404, jsonBody: { error: "Site not found." } };

      const current = site.actionStatus ?? "none";
      if (!isValidTransition(current, status)) {
        return {
          status: 400,
          jsonBody: {
            error: `Cannot move from "${current}" to "${status}". Expected "${NEXT_STATUS[current]}".`,
          },
        };
      }

      const actionUpdatedAt = new Date().toISOString();
      await container.item(id, id).patch([
        { op: "set", path: "/actionStatus", value: status },
        { op: "set", path: "/actionUpdatedAt", value: actionUpdatedAt },
      ]);

      return { jsonBody: { actionStatus: status, actionUpdatedAt } };
    } catch (err) {
      context.error("updateSiteAction failed", err);
      return { status: 500, jsonBody: { error: "Failed to update action status." } };
    }
  },
});
