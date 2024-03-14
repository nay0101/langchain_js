import { PostgresRecordManager } from "@langchain/community/indexes/postgres";
import { OpenAIEmbeddings } from "@langchain/openai";
import { index } from "langchain/indexes";
import { config } from "dotenv";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { Client } from "@elastic/elasticsearch";
import { useDirectoryLoader } from "./utils/fileloaders.js";

config();
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID;

const indexName = "elastic_postgres";
const postgresTableName = "elastic_postgres";

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-ada-002",
});

let vectorStore;
try {
  vectorStore = new ElasticVectorSearch(embeddings, {
    client: new Client({
      auth: {
        apiKey: ELASTIC_API_KEY,
      },
      cloud: {
        id: ELASTIC_CLOUD_ID,
      },
    }),
    indexName: indexName,
  });
} catch (err) {
  console.log(err);
}

// Create a new record manager
const recordManagerConfig = {
  postgresConnectionOptions: {
    type: "postgres",
    host: "127.0.0.1",
    port: 5432,
    user: "postgres",
    password: "123456",
    database: "postgres",
  },
  tableName: postgresTableName,
};

const recordManager = new PostgresRecordManager(indexName, recordManagerConfig);

await recordManager.createSchema();

const docs = await useDirectoryLoader("./assets/Sample Data");

console.log(
  await index({
    docsSource: docs,
    recordManager,
    vectorStore,
    options: {
      cleanup: "full",
      sourceIdKey: "source",
    },
  })
);

await recordManager.end();
