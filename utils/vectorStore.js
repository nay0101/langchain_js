import { Chroma } from "@langchain/community/vectorstores/chroma";
import { index } from "langchain/indexes";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { config } from "dotenv";
import { Client } from "@elastic/elasticsearch";
import { RecordManager } from "./recordManager.js";
import { SimilarityThresholdRetriever } from "./embeddingFilter.js";

config();

async function getRetriever({
  documents = [],
  embeddings,
  collectionName,
  k = 1,
  similarityThreshold = 0.0001,
  ingestion = true,
}) {
  const vectorStore = new Chroma(embeddings, {
    collectionName: collectionName,
    collectionMetadata: { "hnsw:space": "cosine" },
  });

  if (ingestion) {
    const recordManager = await RecordManager({ tableName: collectionName });

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
  }

  const retrieverConfig = {
    k: k,
    searchType: "similarity",
  };

  const baseRetriever = vectorStore.asRetriever(retrieverConfig);

  const retriever = SimilarityThresholdRetriever({
    baseRetriever,
    embeddings,
    similarityThreshold,
  });

  return retriever;
}

// For Testing
async function getRetrieverOnly({
  embeddings,
  collectionName,
  k = 1,
  similarityThreshold = 0.0001,
}) {
  const vectorStore = new Chroma(embeddings, {
    collectionName: collectionName,
    collectionMetadata: { "hnsw:space": "cosine" },
  });

  const retrieverConfig = {
    k: k,
    searchType: "similarity",
  };

  const baseRetriever = vectorStore.asRetriever(retrieverConfig);

  const retriever = SimilarityThresholdRetriever({
    baseRetriever,
    embeddings,
    similarityThreshold,
  });

  return retriever;
}

async function getElasticRetriever({
  documents,
  embeddings,
  collectionName,
  k = 1,
  similarityThreshold = 0.0001,
}) {
  const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
  const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID;
  const ELASTIC_URL = process.env.ELASTIC_URL;

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
  } else if (ELASTIC_CLOUD_ID) {
    config.cloud = {
      id: ELASTIC_CLOUD_ID,
    };
  }

  config.auth = {
    apiKey: ELASTIC_API_KEY,
  };

  const vectorStore = new ElasticVectorSearch(embeddings, {
    client: new Client(config),
    indexName: vectorStoreIndexName,
  });

  const recordManager = await RecordManager({ tableName: collectionName });

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
    k: k,
    searchType: "similarity",
  };
  const baseRetriever = vectorStore.asRetriever(retrieverConfig);

  const retriever = SimilarityThresholdRetriever({
    baseRetriever,
    embeddings,
    similarityThreshold,
  });

  return retriever;
}

export { getRetriever, getElasticRetriever, getRetrieverOnly };
