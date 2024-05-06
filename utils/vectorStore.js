import { Chroma } from "@langchain/community/vectorstores/chroma";
import { index } from "langchain/indexes";
import { PostgresRecordManager } from "@langchain/community/indexes/postgres";

async function getRetriever(documents, embeddings, collectionName) {
  const postgresTableName = collectionName;

  const vectorStoreConfig = {
    k: 1,
    searchType: "similarity",
  };

  const vectorStore = await Chroma.fromDocuments(documents, embeddings, {
    collectionName: collectionName,
  });

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
