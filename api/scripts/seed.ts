import "dotenv/config";
import { CosmosClient } from "@azure/cosmos";
import { seedSites } from "../src/data/seedData";

async function main() {
  const endpoint = process.env.COSMOS_ENDPOINT;
  const key = process.env.COSMOS_KEY;
  const databaseId = process.env.COSMOS_DATABASE ?? "beaconSignalDemo";
  const containerId = process.env.COSMOS_CONTAINER ?? "sites";

  if (!endpoint || !key) {
    throw new Error("Set COSMOS_ENDPOINT and COSMOS_KEY (e.g. in api/.env) before seeding.");
  }

  const client = new CosmosClient({ endpoint, key });
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ["/id"] },
  });

  for (const site of seedSites) {
    await container.items.upsert(site);
    console.log(`Seeded ${site.id} - ${site.name}`);
  }

  console.log("Seeding complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
