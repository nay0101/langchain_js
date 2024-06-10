import { Chroma } from "@langchain/community/vectorstores/chroma";
import { index } from "langchain/indexes";
import { PostgresRecordManager } from "@langchain/community/indexes/postgres";
import { EmbeddingsFilter } from "langchain/retrievers/document_compressors/embeddings_filter";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";

async function getRetriever({
  documents,
  embeddings,
  collectionName,
  k = 1,
  similarityThreshold = 0.01,
}) {
  const postgresTableName = collectionName;

  const vectorStore = new Chroma(embeddings, {
    collectionName: collectionName,
    collectionMetadata: { "hnsw:space": "cosine" },
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

  await index({
    docsSource: [],
    recordManager,
    vectorStore,
    options: {
      cleanup: "full",
      sourceIdKey: "source",
    },
  });

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

  const retrieverConfig = {
    k: 5,
    searchType: "similarity",
  };
  const baseRetriever = vectorStore.asRetriever(retrieverConfig);

  const baseCompressor = new EmbeddingsFilter({
    embeddings,
    similarityThreshold,
    k: k,
  });

  const retriever = new ContextualCompressionRetriever({
    baseCompressor,
    baseRetriever,
  });

  return retriever;
}

export { getRetriever };
