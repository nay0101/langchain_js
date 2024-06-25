import { Chroma } from "@langchain/community/vectorstores/chroma";
import { index } from "langchain/indexes";
import { PostgresRecordManager } from "@langchain/community/indexes/postgres";
import { EmbeddingsFilter } from "langchain/retrievers/document_compressors/embeddings_filter";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { config } from "dotenv";
import { Client } from "@elastic/elasticsearch";

config();

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

  console.log(
    await index({
      docsSource: [],
      recordManager,
      vectorStore,
      options: {
        cleanup: "full",
        sourceIdKey: "source",
      },
    })
  );

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

async function getElasticRetriever({
  documents,
  embeddings,
  collectionName,
  k = 1,
  similarityThreshold = 0.01,
}) {
  const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY ?? null;
  const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID ?? null;
  const ELASTIC_URL = process.env.ELASTIC_URL ?? null;

  const vectorStoreIndexName = collectionName.toLowerCase();
  let config = {
    auth: {
      apiKey: ELASTIC_API_KEY,
    },
  };

  // Requires URL or Cloud ID
  if (ELASTIC_URL) {
    config = {
      node: ELASTIC_URL,
    };
    console.log("URL");
  } else if (ELASTIC_CLOUD_ID) {
    config.cloud = {
      id: ELASTIC_CLOUD_ID,
    };
    console.log("Cloud ID");
  }

  config.auth = {
    apiKey: ELASTIC_API_KEY,
  };

  const vectorStore = new ElasticVectorSearch(embeddings, {
    client: new Client(config),
    indexName: vectorStoreIndexName,
  });

  const postgresTableName = collectionName;
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
      docsSource: [],
      recordManager,
      vectorStore,
      options: {
        cleanup: "full",
        sourceIdKey: "source",
      },
    })
  );

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

export { getRetriever, getElasticRetriever };
