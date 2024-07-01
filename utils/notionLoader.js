import { NotionAPILoader } from "@langchain/community/document_loaders/web/notionapi";
import { splitDocuments } from "./splitDocuments.js";
import { config } from "dotenv";

config();

const useNotionLoader = async (token, results) => {
  const promises = results.map(async (result) => {
    const pageLoader = new NotionAPILoader({
      clientOptions: {
        auth: token,
      },
      id: result.id.replaceAll("-", ""),
      type: result.object,
      callerOptions: {
        maxConcurrency: 64,
      },
      propertiesAsHeader: result.object === "database",
    });

    const doc = await pageLoader.load();
    return doc;
  });

  const docs = await Promise.all(promises);
  const { documents } = await splitDocuments(docs);

  return documents;
};

export { useNotionLoader };
