import { Chroma } from "@langchain/community/vectorstores/chroma";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { Client } from "@elastic/elasticsearch";
import { index } from "langchain/indexes";
import { PostgresRecordManager } from "@langchain/community/indexes/postgres";
import { config } from "dotenv";

config();
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID;

async function getRetriever(documents, embeddings, collectionName) {
  const vectorStoreConfig = {
    k: 15,
    searchType: "similarity",
  };

  const vectorStore = new Chroma(embeddings, {
    collectionName: collectionName,
  });
  // const vectorStore = new ElasticVectorSearch(embeddings, {
  //   client: new Client({
  //     auth: {
  //       apiKey: ELASTIC_API_KEY,
  //     },
  //     cloud: {
  //       id: ELASTIC_CLOUD_ID,
  //     },
  //   }),
  //   indexName: collectionName,
  // });

  const postgresTableName = "hlb";
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

  const recordManager = new PostgresRecordManager(
    collectionName,
    recordManagerConfig
  );

  await recordManager.createSchema();

  console.log(
    await index({
      docsSource: documents,
      recordManager,
      vectorStore,
      options: {
        cleanup: "full",
        sourceIdKey: "source",
      },
    })
  );

  return vectorStore.asRetriever(vectorStoreConfig);
}

export { getRetriever };
