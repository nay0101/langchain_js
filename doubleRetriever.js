import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { useCheerio } from "./utils/webloaders.js";
import { getRetriever } from "./utils/vectorStore.js";
import { useCheerioWebCrawler } from "./utils/webcrawler.js";
import { reset } from "./reset.js";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import { useDirectoryLoader } from "./utils/fileloaders.js";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import CallbackHandler from "langfuse-langchain";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
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

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 1024,
});

// Retriever
const contextCollection = "firstRetriever";
const firstRetriever = await getRetriever(
  documents,
  embeddings,
  contextCollection
);

const fewshotsCollection = "secondRetriever";
const secondRetriever = await getRetriever(
  files,
  embeddings,
  fewshotsCollection
);

const retriever = new EnsembleRetriever({
  retrievers: [firstRetriever, secondRetriever],
  weights: [0.5, 0.5],
});
// ----------------------------------------
// const llm = new HuggingFaceInference({
//   maxRetries: 0,
//   model: "meta-llama/Meta-Llama-3-70B-Instruct",
//   maxTokens: 1000,
// });

const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.9,
});

// Contextualize question
const contextualizeQSystemPrompt = `
Given a chat history and the latest user question
which might reference context in the chat history,
formulate a standalone question which can be understood
without the chat history. Do NOT answer the question, just
reformulate it if needed and otherwise return it as is.`;

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
You are an assistant for question-answering tasks. Use
the following pieces of retrieved context to answer the
question. If you don't know the answer, just say that you
don't know. Use three sentences maximum and keep the answer
concise.
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
});

const chain = await createRetrievalChain({
  retriever: historyAwareRetriever,
  combineDocsChain: questionAnswerChain,
});

const chatHistory = [];

const langfuseHandler = new CallbackHandler({
  userId: "Nay Lin Aung",
  sessionId: "two retriever",
});

/* Invoking Chain for Q&A */
const askQuestion = async (question) => {
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
