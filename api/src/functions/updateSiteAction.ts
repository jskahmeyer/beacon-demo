import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSitesContainer } from "../data/cosmosClient";
import { SiteMetrics } from "../types";

type ActionStatus = NonNullable<SiteMetrics["actionStatus"]>;

// Linear progression, with one exception: "resolved" cycles back to
// "flagged" rather than being a true dead end — a resolved site can
// always be reopened manually if new problems come up later, regardless
// of what the AI's most recent assessment currently says.
const NEXT_STATUS: Record<string, ActionStatus> = {
  none: "flagged",
  flagged: "acknowledged",
  acknowledged: "resolved",
  resolved: "flagged",
};

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
      if (status !== NEXT_STATUS[current]) {
        return {
          status: 400,
          jsonBody: {
            error: `Cannot move from "${current}" to "${status}". Expected "${NEXT_STATUS[current] ?? "no further transitions"}".`,
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
