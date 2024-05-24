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
import { useCheerio, usePuppeteer } from "./utils/webloaders.js";
import { getRetriever } from "./utils/vectorStore.js";
import { generateAnswers } from "./utils/answerGeneration.js";
import { EmbeddingsFilter } from "langchain/retrievers/document_compressors/embeddings_filter";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { useCheerioWebCrawler } from "./utils/webcrawler.js";
import { CallbackHandler } from "langfuse-langchain";
import { reset } from "./reset.js";

config();
await reset();

const urls = [
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit.html?icp=hlb-en-all-footer-txt-fd",
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/fixed-deposit-account.html",
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/e-fixed-deposit.html",
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/flexi-fd.html",
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/senior-savers-flexi-fd.html",
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/junior-fixed-deposit.html",
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/foreign-fixed-deposit-account.html",
  "https://www.hlb.com.my/en/personal-banking/help-support/fees-and-charges/deposits.html",
];

/* Create Training Data for Chatbot */
const documents = await useCheerio(urls);

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 1024,
});

const collectionName = "langfuseIntegration";
const retriever = await getRetriever(documents, embeddings, collectionName);
// ----------------------------------------
let tempToken = 0;
const llm = new ChatOpenAI({
  modelName: "gpt-4-turbo",
  temperature: 0.1,
});

/* Creating Prompt */
const system_template = `Use the following pieces of context to answer the users question. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.
You can also reference to the sample question and answers.
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
  outputKey: "text",
  verbose: true,
  qaChainOptions: {
    type: "stuff",
    prompt: prompt,
  },
});
const langfuseHandler = new CallbackHandler({
  userId: "user name",
  sessionId: "chat name",
});
/* Invoking Chain for Q&A */
const askQuestion = async (question) => {
  langfuseHandler.metadata = { question }; //for easy trackings
  const result = await chain.invoke(
    {
      question,
      chat_history: memory,
    },
    { callbacks: [langfuseHandler] }
  );

  const answer = await result.text;
  const sources = await result.sourceDocuments;
  console.log(sources);
  console.log(answer);

  await langfuseHandler.shutdownAsync();

  return { question, answer, sources };
};

await askQuestion("how many types of fixed deposit do you offer?");
await askQuestion("tell me about the second one");
