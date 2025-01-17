import { Client } from "@elastic/elasticsearch";
import { config } from "dotenv";
import { useDirectoryLoader } from "./utils/fileloaders.js";

config();

const documents = await useDirectoryLoader({
  directory: "./assets/Sample Data/",
});

const client = new Client({
  cloud: {
    id: process.env.ELASTIC_CLOUD_ID,
  },
  auth: {
    apiKey: process.env.ELASTIC_API_KEY,
  },
});

const index = "my_index";

// Data Ingestion
await client.indices.delete({ ignore_unavailable: true, index: index });

const createIndex = await client.indices.create({
  index: index,
  mappings: {
    _source: {
      excludes: ["vector.tokens"],
    },
    properties: {
      metadata: {
        properties: {
          language: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
                ignore_above: 256,
              },
            },
          },
          source: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
                ignore_above: 256,
              },
            },
          },
          title: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
                ignore_above: 256,
              },
            },
          },
        },
      },
      text: {
        type: "text",
        fields: {
          keyword: {
            type: "keyword",
            ignore_above: 256,
          },
        },
      },
      vector: {
        properties: {
          is_truncated: {
            type: "boolean",
          },
          model_id: {
            type: "text",
            fields: {
              keyword: {
                type: "keyword",
                ignore_above: 256,
              },
            },
          },
          tokens: {
            type: "sparse_vector",
          },
        },
      },
    },
  },
});

const createPipeline = await client.ingest.putPipeline({
  id: "elser-v2-test",
  processors: [
    {
      inference: {
        model_id: ".elser_model_2",
        input_output: [
          {
            input_field: "text",
            output_field: "vector.tokens",
          },
        ],
      },
    },
  ],
});

// Retriever
const operations = documents.flatMap((doc) => [
  { index: { _index: index } },
  {
    text: doc.pageContent,
    metadata: {
      source: doc.metadata.source,
      title: "Title",
      language: "en",
    },
  },
]);

await client.bulk({
  refresh: true,
  operations,
  pipeline: "elser-v2-test",
  timeout: "60s",
});

const answer = await client.search({
  index: "my_index",
  query: {
    sparse_vector: {
      field: "vector.tokens",
      inference_id: ".elser_model_2",
      query: "do you know about blue whales?",
    },
  },
  size: 2,
});

console.log(answer["hits"]["hits"]);
