import { config } from "dotenv";
import * as uuid from "uuid";

import { MultiVectorRetriever } from "langchain/retrievers/multi_vector";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { Document } from "@langchain/core/documents";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { Client } from "@elastic/elasticsearch";
import { useCheerio, useTableLoader } from "../utils/webloaders.js";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { LocalFileStore } from "langchain/storage/file_system";

config();
const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID;

const tables = await useTableLoader(
  [
    "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/foreign-fixed-deposit-account.html",
  ],
  5,
  10000,
  20
);

const texts = await useCheerio([
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/foreign-fixed-deposit-account.html",
]);

const modelName = "mistralai/Mixtral-8x7B-Instruct-v0.1";
const llm = new HuggingFaceInference({
  model: modelName,
  maxTokens: 1000,
  maxRetries: 0,
});

const chain = RunnableSequence.from([
  { content: (doc) => doc.pageContent },
  PromptTemplate.fromTemplate(
    `Summarize the following document or table:\n\n{content}`
  ),
  llm,
  new StringOutputParser(),
]);

const tableSummaries = await chain.batch(tables, {
  maxConcurrency: 5,
});

const textSummaries = await chain.batch(texts, {
  maxConcurrency: 5,
});

const embeddingModel = "jinaai/jina-embeddings-v2-base-en";
const embeddings = new HuggingFaceInferenceEmbeddings({
  model: "jinaai/jina-embeddings-v2-base-en",
  maxRetries: 0,
});

// The byteStore to use to store the original chunks
const byteStore = await LocalFileStore.fromPath("./bytestore");
const idKey = "doc_id";

// The vectorstore to use to index the child chunks
const vectorstoreIndexName = "mistral24";
const vectorstore = new ElasticVectorSearch(embeddings, {
  client: new Client({
    cloud: {
      id: ELASTIC_CLOUD_ID,
    },
    auth: {
      apiKey: ELASTIC_API_KEY,
    },
  }),
  indexName: vectorstoreIndexName,
});

const retriever = new MultiVectorRetriever({
  vectorstore,
  byteStore,
  idKey,
});

// Use the retriever to add the original chunks to the document store
const tableIds = tables.map((_) => uuid.v4());
const summaryTables = tableSummaries.map((summary, i) => {
  const summaryTable = new Document({
    pageContent: summary,
    metadata: {
      [idKey]: tableIds[i],
    },
  });
  return summaryTable;
});
const tableKeyValuePairs = tables.map((originalDoc, i) => [
  tableIds[i],
  originalDoc,
]);
await retriever.vectorstore.addDocuments(summaryTables);
await retriever.docstore.mset(tableKeyValuePairs);

const textIds = texts.map((_) => uuid.v4());
const summaryTexts = textSummaries.map((summary, i) => {
  const summaryText = new Document({
    pageContent: summary,
    metadata: {
      [idKey]: textIds[i],
    },
  });
  return summaryText;
});
const textKeyValuePairs = texts.map((originalDoc, i) => [
  textIds[i],
  originalDoc,
]);
await retriever.vectorstore.addDocuments(summaryTexts);
await retriever.docstore.mset(textKeyValuePairs);

// Vectorstore alone retrieves the small chunks
const vectorstoreResult = await retriever.vectorstore.similaritySearch(
  "interest rates for USD"
);
console.log("Summary", vectorstoreResult);

// Retriever returns larger result
const retrieverResult = await retriever.invoke("interest rates for USD");
console.log("Raw", retrieverResult);
