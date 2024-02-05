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
import { usePuppeteer } from "./utils/webloaders.js";
import { getRetriever } from "./utils/vectorStore.js";
import { EmbeddingsFilter } from "langchain/retrievers/document_compressors/embeddings_filter";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { promises as fs } from "node:fs";

config();

const urls = [
  "https://www.kbzbank.com/mm/%E1%80%9D%E1%80%94%E1%80%BA%E1%80%86%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%99%E1%80%BE%E1%80%AF%E1%80%99%E1%80%BB%E1%80%AC%E1%80%B8/",
  "https://www.kbzbank.com/mm/%e1%80%a1%e1%80%81%e1%80%bc%e1%80%ac%e1%80%b8%e1%80%9d%e1%80%94%e1%80%ba%e1%80%86%e1%80%b1%e1%80%ac%e1%80%84%e1%80%ba%e1%80%99%e1%80%be%e1%80%af%e1%80%99%e1%80%bb%e1%80%ac%e1%80%b8/",
  "https://www.kbzbank.com/mm/%e1%80%85%e1%80%ac%e1%80%9b%e1%80%84%e1%80%ba%e1%80%b8%e1%80%99%e1%80%bb%e1%80%ac%e1%80%b8/",
  "https://www.kbzbank.com/mm/%e1%80%85%e1%80%ac%e1%80%9b%e1%80%84%e1%80%ba%e1%80%b8%e1%80%99%e1%80%bb%e1%80%ac%e1%80%b8/operating-account-mm/",
  "https://www.kbzbank.com/mm/%e1%80%85%e1%80%ac%e1%80%9b%e1%80%84%e1%80%ba%e1%80%b8%e1%80%99%e1%80%bb%e1%80%ac%e1%80%b8/%e1%80%84%e1%80%bd%e1%80%b1%e1%80%85%e1%80%af%e1%80%98%e1%80%8f%e1%80%ba%e1%80%a1%e1%80%95%e1%80%ba%e1%80%84%e1%80%bd%e1%80%b1%e1%80%85%e1%80%ac%e1%80%9b%e1%80%84%e1%80%ba/",
  "https://www.kbzbank.com/mm/%e1%80%85%e1%80%ac%e1%80%9b%e1%80%84%e1%80%ba%e1%80%b8%e1%80%99%e1%80%bb%e1%80%ac%e1%80%b8/%e1%80%85%e1%80%ac%e1%80%9b%e1%80%84%e1%80%ba%e1%80%b8%e1%80%9e%e1%80%b1%e1%80%a1%e1%80%95%e1%80%ba%e1%80%84%e1%80%bd%e1%80%b1%e1%80%85%e1%80%ac%e1%80%9b%e1%80%84%e1%80%ba/",
];

/* Create Training Data for Chatbot */
const documents = await usePuppeteer(urls);

const embeddings = new OpenAIEmbeddings({
  // modelName: "text-embedding-3-small",
  modelName: "text-embedding-ada-002",
});

const collectionName = "crc_chain_js_kbz_mm";
const retriever = await getRetriever(documents, embeddings, collectionName);

const llm = new ChatOpenAI({
  // modelName: "gpt-3.5-turbo-1106",
  modelName: "gpt-4-0125-preview",
  temperature: 0.1,
});

/* Creating Prompt */
const system_template = `Use the following pieces of context to answer the users question. 
If you don't know the answer, just say that you don't know, don't try to make up an answer. 
----------------
{context}`;

const messages = [
  SystemMessagePromptTemplate.fromTemplate(system_template),
  HumanMessagePromptTemplate.fromTemplate("{question}"),
];

const prompt = ChatPromptTemplate.fromMessages(messages);

/* Creating Compression Retriever for Accurate Results */
const embeddings_filter = new EmbeddingsFilter({
  embeddings,
  similarityThreshold: 0.8,
  k: 7,
});

const compression_retriever = new ContextualCompressionRetriever({
  baseCompressor: embeddings_filter,
  baseRetriever: retriever,
});

/* Creating Memory Instance */
const memory = new BufferWindowMemory({
  memoryKey: "chat_history",
  inputKey: "question",
  k: 3,
  returnMessages: true,
});

/* Creating Question Chain */
const chain = ConversationalRetrievalQAChain.fromLLM(
  llm,
  compression_retriever,
  {
    inputKey: "question",
    memory,
    verbose: true,
    qaChainOptions: {
      type: "stuff",
      prompt: prompt,
    },
  }
);

/* Invoking Chain for Q&A */
const askQuestion = async (question) => {
  const answer = await chain.invoke({
    question,
    chat_history: memory,
  });
  return answer;
};

const questions = [
  "KBZ ဘဏ်ရဲ့ဝန်ဆောင်မှုများကိုပြောပြပါ",
  "ငွေ သိန်း ၃၀၀၀ ကို တစ်နှစ် ငွေစုဘဏ်မှာ စုရင် အတိုးစုစုပေါင်းဘယ်လောက်ရမလဲ",
  "ငွေစုဘဏ်အပ်ငွေစာရင်းအတိုးနှုန်းတွေကဘယ်လောက်လဲ",
  "ငွေစာရင်းအမျိုးအစားဘယ်နှမျိုးရှိလဲ",
];

const result = await askQuestion(questions[1]);
await fs.writeFile("./logs/kbz_response.txt", result.text, (err) => {
  if (err) return err;
});
console.log(`Answer: ${result.text}`);
