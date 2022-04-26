import { Client } from "@notionhq/client";

// They don't export their type names it appears

type SearchResults = Awaited<ReturnType<Client["search"]>>["results"];
type Database = Awaited<ReturnType<Client["databases"]["retrieve"]>>;
type DatabaseProperty = Database["properties"][string];

/**
 * Databases, pages, and blocks are all nodes.
 */
type Node = {
  id: string;
};

const initClient = (): Client => {
  if (!process.env.NOTION_TOKEN) {
    throw new Error(
      "No NOTION_TOKEN found. Please set it in your environment variables."
    );
  }

  return new Client({
    auth: process.env.NOTION_TOKEN,
  });
};

/**
 * Find the title property.  Just an example of how to find properties by type.
 */
const getTitleProperty = (db: Database) => {
  const titleProp = Object.values(db.properties).find(
    (prop) => prop.type === "title"
  );

  if (!titleProp) {
    throw new Error("No title property found");
  }

  return titleProp;
};

/**
 * Helps typescript do type discrimination with the search results
 */
const getDatabaseResult = (results: SearchResults): Database => {
  for (const result of results) {
    if (result.object === "database") {
      return result;
    }
  }

  throw new Error(
    "No database found. A database must be shared with the integration to be visible."
  );
};

const createSimplePage = async (
  notion: Client,
  dbId: string,
  titleProp: DatabaseProperty
) =>
  notion.pages.create({
    parent: {
      database_id: dbId,
    },
    icon: {
      type: "emoji",
      emoji: "✅",
    },
    properties: {
      [titleProp.name]: {
        title: [
          {
            text: {
              content: "Hello API World",
            },
          },
        ],
      },
    },
  });

const writeChildBlock = async (notion: Client, page: Node) =>
  notion.blocks.children.append({
    block_id: page.id,
    children: [
      {
        type: "paragraph",
        paragraph: {
          rich_text: [
            {
              type: "text",
              text: { content: "API body...", link: null },
            },
          ],
        },
      },
    ],
  });

const main = async () => {
  const notion = initClient();

  const { results } = await notion.search({
    filter: { property: "object", value: "database" },
  });

  const db = getDatabaseResult(results);
  const titleProp = getTitleProperty(db);

  const page = await createSimplePage(notion, db.id, titleProp);
  console.log("✅ Page created");

  await writeChildBlock(notion, page);
  console.log("✅ Block added");
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    if (err instanceof Error) {
      console.log("❌ " + err.message);
    }

    process.exit(1);
  });
