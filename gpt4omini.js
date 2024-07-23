import { config } from "dotenv";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { useCheerio } from "./utils/webloaders.js";
import { getRetriever, getRetrieverOnly } from "./utils/vectorStore.js";
import { useCheerioWebCrawler } from "./utils/webcrawler.js";
import { reset } from "./utils/reset.js";
import { EnsembleRetriever } from "langchain/retrievers/ensemble";
import { useDirectoryLoader } from "./utils/fileloaders.js";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { createRetrievalChain } from "langchain/chains/retrieval";
import CallbackHandler from "langfuse-langchain";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { reranker } from "./utils/reranker.js";
import { promises as fs } from "node:fs";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

config();
// await reset();

/* Create Training Data for Chatbot */
// const urls = await useCheerioWebCrawler("https://www.kbzbank.com/mm/");
// const documents = await useCheerio(urls, 5, 2000);

const files = await useDirectoryLoader({
  directory: "./assets/Few Shots/KBZ/",
  chunkSize: 2000,
  chunkOverlap: 100,
});

const embeddingModel = "text-embedding-3-large";
const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 256,
});

// Retriever
const contextCollection = "gpt4ofirst";
const contextRetriever = await getRetrieverOnly({
  embeddings,
  collectionName: contextCollection,
  k: 10,
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
const llmModel = "gpt-4o";
const llm = new ChatOpenAI({
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
  retriever: retriever,
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

  // chatHistory.push(
  //   new HumanMessage(result.input),
  //   new AIMessage(result.answer)
  // );

  const input = result.input;
  const context = result.context;
  const answer = result.answer;

  const error = (err) => {
    return console.log(err);
  };

  const filePath = "./gpt4omini10k.txt";
  await fs.appendFile(
    filePath,
    `Question: ${input}\nAnswer: ${answer}\n\nContext:`,
    error
  );
  for (let i = 0; i < context.length; i++) {
    await fs.appendFile(
      filePath,
      `\n\nSource: ${decodeURI(context[i].metadata.source)}\n${
        context[i].pageContent
      }`,
      error
    );
  }
  await fs.appendFile(filePath, `\n-----------------------------\n`, error);
  console.log(`finished: ${question}`);
  await langfuseHandler.shutdownAsync();
  return true;
};

// await askQuestion("KBZ ဘဏ်မှာ ဘယ် product တွေ Service တွေ ရနိုင်လဲ");
// await askQuestion("မင်းတို့ ဘဏ်ကို ဘယ်အချိန်က တည်ထောင်ခဲ့လဲ");
// await askQuestion("ဘဏ်ခွဲဘယ်နှခုမှာ ဝန်ဆောင်မှုပေးလဲ");
// await askQuestion("fixed deposit ရဲ့ interest rate ကိုပြောပြပါ");
// await askQuestion("fixed deposit အကြောင်း အသေးစိတ်ရှင်းပြပါ");
// await askQuestion("fixed deposit မှာ တစ်နှစ်ငွေထည့်ထားလျှင် ဘယ်လောက်ပြန်ရမလဲ");
// await askQuestion("regular accounts နဲ့ old accounts ဘာကွာလဲ");
// await askQuestion("mbanking အကောင့်ဘယ်လိုဖွင့်ရမလဲ");
// await askQuestion("ဘဏ်အကောင့်ဖွင့်ရန် ဖြစ်စဉ်အဆင့်ဆင့်ကိုရှင်းပြပါ");
// await askQuestion(
//   "Credit card ကို ဘယ်လိုလျှောက်ရလဲဖြစ်စဉ်အဆင့်ဆင့်ကိုရှင်းပြပါ"
// );
// await askQuestion("KBZ bank မှာ ဘယ် loan products တွေ ရနိုင်လဲ");
// await askQuestion(
//   "ချေးငွေသက်တမ်း ငါးနှစ်စာဖြင့် home loan ကို EMI calculator ဖြင့်တွက်ပြပါ"
// );
// await askQuestion(
//   "မြန်မာနိုင်ငံသားနှင့်လက်ထပ်ထားသော နိုင်ငံခြားသားအနေနဲ့ home loan လျှောက်ထားနိုင်လား"
// );
// await askQuestion("Loan လျှောက်လွှာက အချိန်ဘယ်လောက်ကြာနိုင်လဲ");
// await askQuestion("KBZ Pay အကြောင်းပြောပြပါ");
// await askQuestion("ငါ့ bank card ကို ဘယ်လို activate လုပ်ရမလဲ");
// await askQuestion(
//   "ငါ credit ကဒ် အခိုးခံလိုက်ရလို့၊အဲ့ကဒ်ကို ဘယ်လိုပိတ်သိမ်းရမလဲ"
// );
// await askQuestion("လုပ်ခလစာပေးဝန်ဆောင်မှု KBZ payroll ‌အကြောင်းရှင်းပြပါ");
await askQuestion(
  "Corporate business တွေအတွက် ဘယ်လို product တွေ service တွေရှိလဲ"
);
await askQuestion("Bulk payment အကြောင်းသေချာရှင်းပြပါ");
