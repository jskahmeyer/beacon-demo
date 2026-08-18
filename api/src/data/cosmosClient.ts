import { CosmosClient, Container } from "@azure/cosmos";

let container: Container | undefined;

export function getSitesContainer(): Container {
  if (container) return container;

  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  const databaseId = process.env.COSMOS_DATABASE ?? "beaconSignalDemo";
  const containerId = process.env.COSMOS_CONTAINER ?? "sites";

  if (!endpoint || !key) {
    throw new Error("Missing COSMOS_ENDPOINT or COSMOS_KEY environment variables.");
  }

  const client = new CosmosClient({ endpoint, key });
  container = client.database(databaseId).container(containerId);
  return container;
}
