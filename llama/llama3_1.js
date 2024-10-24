import { config } from "dotenv";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { useCheerio } from "../utils/webloaders.js";
import { getRetriever, getRetrieverOnly } from "../utils/vectorStore.js";
import { useCheerioWebCrawler } from "../utils/webcrawler.js";
import { reset } from "../utils/reset.js";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import { useDirectoryLoader } from "../utils/fileloaders.js";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import CallbackHandler from "langfuse-langchain";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { reranker } from "../utils/reranker.js";
import { promises as fs } from "node:fs";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { HuggingFaceInference } from "@langchain/community/llms/hf";

config();
// await reset();
// const urls = await useCheerioWebCrawler(
//   "https://win066.wixsite.com/brillar-bank"
// );
// const documents = await useCheerio(urls, 5, 2000);

// const files = await useDirectoryLoader({
//   directory: "./assets/Few Shots/KBZ/",
//   chunkSize: 2000,
//   chunkOverlap: 100,
// });

const embeddingModel = "text-embedding-3-large";
const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 256,
});

// Retriever
const contextCollection = "chunksize_1000";
const contextRetriever = await getRetriever({
  embeddings,
  collectionName: contextCollection,
  k: 5,
  ingestion: false,
});

// const fewshotsCollection = "gpt4osecond4";
// const fewshotRetriever = await getRetriever({
//   documents: files,
//   embeddings,
//   collectionName: fewshotsCollection,
//   k: 5,
// });

const retriever = new EnsembleRetriever({
  retrievers: [contextRetriever],
});

const rerank = reranker({ retriever, k: 5 });

// ----------------------------------------
const modelName = "meta-llama/Meta-Llama-3.1-70B-Instruct";
const llm = new HuggingFaceInference({
  model: modelName,
  maxRetries: 0,
  maxTokens: 100000,
  temperature: 0.1,
});

// Contextualize question
// const contextualizeQSystemPrompt = `
//   <|begin_of_text|><|start_header_id|>system<|end_header_id|>
//   Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is.<|eot_id|><|start_header_id|>user<|end_header_id|>
//   {input}<|eot_id|>
//   <|start_header_id|>assistant<|end_header_id|>`;
const contextualizeQSystemPrompt = `
  Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is.`;

const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
  ["system", contextualizeQSystemPrompt],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

const historyAwareRetriever = await createHistoryAwareRetriever({
  llm,
  retriever: retriever,
  rephrasePrompt: contextualizeQPrompt,
});

// Answer question
// const qaSystemPrompt = `
//   <|begin_of_text|><|start_header_id|>system<|end_header_id|>
//   You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
//   \n\n
//   {context}<|eot_id|><|start_header_id|>user<|end_header_id|>
//   {input}<|eot_id|>
//   <|start_header_id|>assistant<|end_header_id|>
//   `;
const qaSystemPrompt = `
  You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
  \n\n
  {context}
  `;
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
  userId: modelName,
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

  if (chatHistory.length > 5) {
    chatHistory.splice(0, 1);
  }

  const input = result.input;
  const context = result.context;
  const answer = result.answer;

  const error = (err) => {
    return console.log(err);
  };

  const filePath = "./llama3.1_70B_history.txt";
  await fs.appendFile(
    filePath,
    `Question: ${input}\nAnswer: ${answer}\n\nContext:`,
    error
  );
  // for (let i = 0; i < context.length; i++) {
  //   await fs.appendFile(
  //     filePath,
  //     `\n\nSource: ${decodeURI(context[i].metadata.source)}\n${
  //       context[i].pageContent
  //     }`,
  //     error
  //   );
  // }
  await fs.appendFile(filePath, `\n-----------------------------\n`, error);
  console.log(`finished: ${question}`);
  await langfuseHandler.shutdownAsync();
  return true;
};

const jsonData = await fs.readFile(
  "./questionSets/brillarBankQuestions.json",
  "utf-8",
  (err) => {
    if (err) {
      console.log(err);
      return;
    }
  }
);

const questions = JSON.parse(jsonData);
for (let i = 0; i < questions.length; i++) {
  await askQuestion(questions[i].question);
}
