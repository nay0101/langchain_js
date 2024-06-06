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
import { reset } from "./reset.js";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";
import { HuggingFaceInference } from "@langchain/community/llms/hf";

config();
await reset();

// const urls = [
//   "https://www.hlb.com.my/en/personal-banking/fixed-deposit.html?icp=hlb-en-all-footer-txt-fd",
//   "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/fixed-deposit-account.html",
//   "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/e-fixed-deposit.html",
//   "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/flexi-fd.html",
//   "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/senior-savers-flexi-fd.html",
//   "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/junior-fixed-deposit.html",
//   "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/foreign-fixed-deposit-account.html",
//   "https://www.hlb.com.my/en/personal-banking/help-support/fees-and-charges/deposits.html",
// ];

/* Create Training Data for Chatbot */
const urls = await useCheerioWebCrawler(
  "https://win066.wixsite.com/brillar-bank",
  2
);
const documents = await useCheerio(urls);

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 1024,
});

const collectionName = "postgres_js_test";
const retriever = await getRetriever(documents, embeddings, collectionName);
// ----------------------------------------
let tempToken = 0;
const llm = new ChatOpenAI({
  // modelName: "gpt-3.5-turbo-1106",
  modelName: "gpt-4-turbo",
  temperature: 0.9,
  streaming: true,
  callbacks: [
    {
      handleLLMNewToken(token) {
        console.log(token);
      },
      handleLLMEnd(output) {
        console.log(output);
      },
    },
  ],
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

const compressorModel = new HuggingFaceInference({
  maxRetries: 0,
  model: "meta-llama/Meta-Llama-3-70B-Instruct",
  maxTokens: 1000,
});
const baseCompressor = LLMChainExtractor.fromLLM(compressorModel);

const compressionRetriever = new ContextualCompressionRetriever({
  baseCompressor,
  baseRetriever: retriever,
});

/* Creating Question Chain */
const chain = ConversationalRetrievalQAChain.fromLLM(llm, retriever, {
  returnSourceDocuments: true,
  memory: memory,
  // verbose: true,
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
  console.log(sources);
  console.log(answer);
  return { question, answer, sources };
};

// await generateAnswers({
//   askQuestion,
//   returnSources: true,
//   userInput: true,
// }); // Set userInput to true to get the User Input
// await askQuestion(
//   "I want to invest USD10000 for Brillar Bank Foreign Currency Fixed Deposit for 12 months. What is the total interest amount at the end of term in RM?"
// );
await askQuestion("how many types of fixed deposit do you offer?");
