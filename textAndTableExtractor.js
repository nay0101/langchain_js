import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { useDirectoryLoader } from "./utils/fileloaders.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { config } from "dotenv";
import { ElasticVectorSearch } from "@langchain/community/vectorstores/elasticsearch";
import { Document } from "@langchain/core/documents";
import { Client } from "@elastic/elasticsearch";

config();

const ELASTIC_API_KEY = process.env.ELASTIC_API_KEY;
const ELASTIC_CLOUD_ID = process.env.ELASTIC_CLOUD_ID;
const docs = await useDirectoryLoader({
  directory: "./assets/Brillar Bank/",
});

const doc = docs.map((doc) => doc.pageContent);

const model = new ChatOpenAI({
  model: "gpt-3.5-turbo",
});

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 256,
});
const prompt = ChatPromptTemplate.fromTemplate(
  "Extract Tables from the provided context: {context}"
);
const chain = RunnableSequence.from([prompt, model, new StringOutputParser()]);

const tables = await chain.invoke({ context: doc });

const tableDocs = [
  new Document({
    pageContent: tables,
    metadata: {
      source: "name",
    },
  }),
];

const vectorstoreIndexName = "tablestest";
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

await vectorstore.addDocuments(tableDocs);
