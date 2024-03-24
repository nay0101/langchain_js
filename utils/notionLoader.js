import { NotionAPILoader } from "langchain/document_loaders/web/notionapi";
import { splitDocuments } from "./splitDocuments.js";
import { config } from "dotenv";

config();
// const NOTION_INTEGRATION_TOKEN = process.env.NOTION_INTEGRATION_TOKEN;
// const PAGE_ID = "2def6828ebab44dba4022eed9c1b29a4";

// const pageLoader = new NotionAPILoader({
//   clientOptions: {
//     auth: NOTION_INTEGRATION_TOKEN,
//   },
//   id: PAGE_ID,
//   type: "page",
// });

// const docs = await pageLoader.load();
// const { documents } = await splitDocuments(docs);
// console.log(documents);
