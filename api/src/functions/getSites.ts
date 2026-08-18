import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSitesContainer } from "../data/cosmosClient";

app.http("getSites", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "sites",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const container = getSitesContainer();
      const { resources } = await container.items.readAll().fetchAll();
      return { jsonBody: resources };
    } catch (err) {
      context.error("getSites failed", err);
      return { status: 500, jsonBody: { error: "Failed to load sites." } };
    }
  },
});
