import { config } from "dotenv";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { useCheerio } from "./utils/webloaders.js";
import { getRetriever } from "./utils/vectorStore.js";
import { useCheerioWebCrawler } from "./utils/webcrawler.js";
import { reset } from "./utils/reset.js";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import { useDirectoryLoader } from "./utils/fileloaders.js";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import CallbackHandler from "langfuse-langchain";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { HuggingFaceInference } from "@langchain/community/llms/hf";

config();
await reset();

/* Create Training Data for Chatbot */
const urls = await useCheerioWebCrawler(
  "https://win066.wixsite.com/brillar-bank",
  2
);
const documents = await useCheerio(urls);

const files = await useDirectoryLoader("./assets/Few Shots/", 1000, 100);

const embeddingModel = "jinaai/jina-embeddings-v2-base-en";
const embeddings = new HuggingFaceInferenceEmbeddings({
  model: embeddingModel,
  maxRetries: 0,
});

// Retriever
const contextCollection = "firstRetriever";
const firstRetriever = await getRetriever({
  documents,
  embeddings,
  collectionName: contextCollection,
  k: 3,
  similarityThreshold: 0.2,
});

const fewshotsCollection = "secondRetriever";
const secondRetriever = await getRetriever({
  documents: files,
  embeddings,
  collectionName: fewshotsCollection,
  k: 3,
});

const retriever = new EnsembleRetriever({
  retrievers: [firstRetriever, secondRetriever],
  weights: [0.5, 0.5],
});

// ----------------------------------------
const llmModel = "mistralai/Mixtral-8x7B-Instruct-v0.1";
const llm = new HuggingFaceInference({
  model: llmModel,
  maxRetries: 0,
  maxTokens: 1000,
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
  retriever,
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

  console.log(result);
  await langfuseHandler.shutdownAsync();

  return true;
};

await askQuestion("what are the interest rates for fixed deposit?");
