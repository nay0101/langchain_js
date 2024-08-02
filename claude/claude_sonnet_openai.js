import { config } from "dotenv";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { useCheerio } from "../utils/webloaders.js";
import { getElasticRetriever, getRetriever } from "../utils/vectorStore.js";
import { useCheerioWebCrawler } from "../utils/webcrawler.js";
import { reset } from "../utils/reset.js";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import { useDirectoryLoader } from "../utils/fileloaders.js";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import CallbackHandler from "langfuse-langchain";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { reranker } from "../utils/reranker.js";
import { promises as fs } from "node:fs";
import { finished } from "node:stream";
import { ChatAnthropic } from "@langchain/anthropic";
import { OpenAIEmbeddings } from "@langchain/openai";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";

config();
await reset();

/* Create Training Data for Chatbot */
const urls = await useCheerioWebCrawler(
  "https://win066.wixsite.com/brillar-bank",
  0,
  [
    "https://win066.wixsite.com/brillar-bank/brillar-bank-blog-1",
    "https://win066.wixsite.com/brillar-bank/brillar-bank-blog-2",
    "https://win066.wixsite.com/brillar-bank/brillar-bank-blog-3",
    "https://win066.wixsite.com/brillar-bank/brillar-bank-blog-4",
  ]
);

const documents = await useCheerio(urls, 5, 4000);

const files = await useDirectoryLoader({
  directory: "./assets/Few Shots/",
  chunkSize: 1000,
  chunkOverlap: 100,
});

const embeddingModel = "text-embedding-3-large";
const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 1024,
});

// Retriever
const contextCollection = "claudeFirst";
const contextRetriever = await getRetriever({
  documents,
  embeddings,
  collectionName: contextCollection,
  k: 5,
});

const fewshotsCollection = "claudeSecond";
const fewshotRetriever = await getRetriever({
  documents: files,
  embeddings,
  collectionName: fewshotsCollection,
  k: 5,
});

const retriever = new EnsembleRetriever({
  retrievers: [contextRetriever, fewshotRetriever],
});

const rerank = reranker({ retriever, k: 5 });

// ----------------------------------------
const llmModel = "claude-3-5-sonnet-20240620";
const llm = new ChatAnthropic({
  model: llmModel,
  temperature: 0.1,
});

// Contextualize question
const contextualizeQSystemPrompt = `
  Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is.`;

const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
  ["system", contextualizeQSystemPrompt],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

const historyAwareRetriever = await createHistoryAwareRetriever({
  llm,
  retriever: rerank,
  rephrasePrompt: contextualizeQPrompt,
});

// Answer question
const qaSystemPrompt = `
  You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
  \n\n
  {context}`;
const qaPrompt = ChatPromptTemplate.fromMessages([
  ["system", qaSystemPrompt],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

// Below we use createStuffDocuments_chain to feed all retrieved context
// into the LLM. Note that we can also use StuffDocumentsChain and other
// instances of BaseCombineDocumentsChain.
const questionAnswerChain = await createStuffDocumentsChain({
  llm,
  prompt: qaPrompt,
  documentSeparator: "\n",
});

const chain = await createRetrievalChain({
  retriever: historyAwareRetriever,
  combineDocsChain: questionAnswerChain,
});

const langfuseHandler = new CallbackHandler({
  sessionId: embeddingModel,
  userId: llmModel,
});

const chatHistory = [];

/* Invoking Chain for Q&A */
const askQuestion = async (question) => {
  langfuseHandler.metadata = {
    question,
  };
  const result = await chain.invoke(
    {
      input: question,
      chat_history: chatHistory,
    },
    { callbacks: [langfuseHandler] }
  );

  chatHistory.push(
    new HumanMessage(result.input),
    new AIMessage(result.answer)
  );

  const input = result.input;
  const context = result.context;
  const answer = result.answer;

  const error = (err) => {
    return console.log(err);
  };

  const filePath = "./claude_openai_burmese.txt";
  await fs.appendFile(
    filePath,
    `Question: ${input}\nAnswer: ${answer}\n\nContext:`,
    error
  );
  for (let i = 0; i < context.length; i++) {
    await fs.appendFile(filePath, `\n\n${context[i].pageContent}`, error);
  }
  await fs.appendFile(filePath, `\n-----------------------------\n`, error);
  console.log(`finished: ${question}`);
  await langfuseHandler.shutdownAsync();
  return true;
};

await askQuestion("What are the Interest Rates for Fixed Deposit");

// await askQuestion(
//   "Tell what is Brillar bank, where is it based in etc., and the type of products it offers"
// );
// await askQuestion("How many type of fixed deposits does brillar bank provide");
// await askQuestion("What is eFixed Deposit");
// await askQuestion("What are the Interest rates for eFixed Deposit");
// await askQuestion("Do the same for rest of the products");
// await askQuestion(
//   "What is the difference between Fixed Deposit and eFixed Deposit?"
// );
// await askQuestion(
//   "Give an example of how interest for a product is calculated"
// );
// await askQuestion(
//   "Lets say I want to invest RM 50,000 in Fixed Deposit for 12 months. Please calculate the total amount that I can withdraw  at the end of the term."
// );
// await askQuestion(
//   "What are the minimum opening amount for foreign currency fixed deposit in USD in your bank?"
// );
// await askQuestion(
//   "what is the difference between the percentage of interest rates of flexi fixed deposit and e-fixed deposit"
// );
// await askQuestion(
//   "How many type of currency does Brillar bank provide for foreign currency fixed deposit?"
// );
