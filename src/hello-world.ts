import { Client } from "@notionhq/client";

if (!process.env.NOTION_TOKEN) {
  console.log(
    "❌ No NOTION_TOKEN found. Please set it in your environment variables."
  );
  process.exit(1);
}

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const createSimplePage = async (dbId: string) =>
  notion.pages.create({
    parent: {
      database_id: dbId,
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: "Hello from the API",
            },
          },
        ],
      },
    },
  });

const main = async () => {
  const { results: databases } = await notion.search({
    filter: { property: "object", value: "database" },
  });

  if (databases.length === 0) {
    console.log(
      "❌ No database found. A database must be shared with the integration to be visible."
    );
    throw new Error("No database found");
  }

  const databaseId = databases[0].id;
  await createSimplePage(databaseId);
  console.log("✅ Page created");
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
