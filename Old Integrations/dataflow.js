import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "@langchain/openai";
import { BufferWindowMemory } from "langchain/memory";
import { useCheerio } from "../utils/webloaders.js";
import { getRetriever } from "../utils/vectorStore.js";
import { reset } from "../utils/reset.js";
import { ChromaClient } from "chromadb";
import { promises as fs } from "node:fs";

config();
await reset();

/* Create Training Data for Chatbot */
const urls = [
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/fixed-deposit-account.html",
];

const documents = await useCheerio(urls);

await fs.writeFile("./assets/documents.txt", "", (err) => {
  if (err) return;
});
await fs.writeFile("./assets/vectorstore.txt", "", (err) => {
  if (err) return;
});
for (let i = 0; i < documents.length; i++) {
  await fs.appendFile(
    "./assets/documents.txt",
    `{
      pageContent: ${documents[i].pageContent},
      metadata: {
        source: ${documents[i].metadata.source},
        loc: {lines: { from: ${documents[i].metadata.loc.lines.from}, to: ${documents[i].metadata.loc.lines.to}}}
      }
    }\n\n`,
    (err) => {
      if (err) return;
    }
  );
}

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 1024,
});

const collectionName = "js_test";
const retriever = await getRetriever({ documents, embeddings, collectionName });

const client = new ChromaClient();
const collection = await client.getCollection({
  name: collectionName,
});

const ids = (await collection.get()).ids;
for (let i = 0; i < ids.length; i++) {
  const result = await collection.get({
    ids: [ids[i]],
    include: ["embeddings", "metadatas", "documents"],
  });
  await fs.appendFile(
    "./assets/vectorstore.txt",
    `Chunk ${i + 1}
    {
      embeddings: [
        ${result.embeddings}
      ],
      metadatas: [
        {
          locFrom: ${result.metadatas[0].locFrom},
          locTo: ${result.metadatas[0].locTo},
          source: ${result.metadatas[0].source}
        }
      ],
      documents: ${result.documents},
    }\n\n`,
    (err) => {
      if (err) return;
    }
  );
}

const llm = new ChatOpenAI({
  modelName: "gpt-4o",
  temperature: 0.9,
});

/* Creating Prompt */
const system_template = `Use the following pieces of context to answer the users question. 
Make sure to sound like a real person. If the answer is not provided in the context, simply say "I don't have the information".
----------------
{context}`;

const messages = [
  SystemMessagePromptTemplate.fromTemplate(system_template),
  HumanMessagePromptTemplate.fromTemplate("{question}"),
];

const prompt = ChatPromptTemplate.fromMessages(messages);

/* Creating Memory Instance */
const memory = new BufferWindowMemory({
  memoryKey: "chat_history",
  inputKey: "question",
  outputKey: "text",
  k: 3,
  returnMessages: true,
});

/* Creating Question Chain */
const chain = ConversationalRetrievalQAChain.fromLLM(llm, retriever, {
  returnSourceDocuments: true,
  memory: memory,
  verbose: true,
  qaChainOptions: {
    type: "stuff",
    prompt: prompt,
  },
});

/* Invoking Chain for Q&A */
const askQuestion = async (question) => {
  const result = await chain.invoke({
    question,
    chat_history: memory,
  });

  const answer = await result.text;
  const sources = await result.sourceDocuments;
  // console.log(sources);
  // console.log(answer);
  return { question, answer, sources };
};

await askQuestion("how many types of fixed deposit do you offer?");
