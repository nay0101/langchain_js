import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  FewShotChatMessagePromptTemplate,
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
import { SemanticSimilarityExampleSelector } from "@langchain/core/example_selectors";
import { Document } from "@langchain/core/documents";

config();
await reset();

/* Create Training Data for Chatbot */
const urls = await useCheerioWebCrawler(
  "https://win066.wixsite.com/brillar-bank",
  2
);
const documents = await useCheerio(urls);

const files = await useDirectoryLoader("./assets/Few Shots/", 1000, 100);
// console.log(files);
const examples = files.map((file) => {
  const content = file.pageContent.split("input: ")[1].split("output: ");
  const finalDoc = new Document({
    pageContent: file.pageContent,
    metadata: Object.assign(
      file.metadata,
      {
        input: content[0],
      },
      { output: content[1] }
    ),
  });
  return finalDoc;
});

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 1024,
});

const fewshotsCollection = "fewshotRetriever";
const fewshotRetriever = await getRetriever(
  examples,
  embeddings,
  fewshotsCollection
);

const exampleSelector = new SemanticSimilarityExampleSelector({
  vectorStoreRetriever: fewshotRetriever,
  exampleKeys: ["input", "output"],
});

const examplePrompt = ChatPromptTemplate.fromMessages([
  ["human", "{input}"],
  ["ai", "{output}"],
]);

const fewShotPrompt = new FewShotChatMessagePromptTemplate({
  inputVariables: ["input"],
  exampleSelector,
  examplePrompt,
});

// Retriever
const contextCollection = "contextRetriever";
const contextRetriever = await getRetriever(
  documents,
  embeddings,
  contextCollection
);

// ----------------------------------------
const llm = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.1,
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
  retriever: contextRetriever,
  rephrasePrompt: contextualizeQPrompt,
});

// Answer question
const qaSystemPrompt = `
You are an assistant for question-answering tasks. Try to answer by your recent knowledge first. If you cannot answer from the chat history, use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Don't answer from your general knowledge. Use three sentences maximum and keep the answer concise.
\n\n
{context}`;

const qaPrompt = ChatPromptTemplate.fromMessages([
  ["system", qaSystemPrompt],
  new MessagesPlaceholder("chat_history"),
  fewShotPrompt,
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

const chatHistory = [];

const langfuseHandler = new CallbackHandler({
  sessionId: "Few Shot Retrievers",
  userId: "Nay Lin Aung",
});

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
