import { config } from "dotenv";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferWindowMemory } from "langchain/memory";
import { useCheerio, usePuppeteer } from "./utils/webloaders.js";
import { getRetriever } from "./utils/vectorStore.js";
import { generateAnswers } from "./utils/answerGeneration.js";
import { EmbeddingsFilter } from "langchain/retrievers/document_compressors/embeddings_filter";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";

config();

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
// const documents = await useDirectoryLoader("./assets/HLB Data");

const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "text-embedding-004",
});

const collectionName = "crc_chain_js_googlechat_new";
const retriever = await getRetriever(documents, embeddings, collectionName);
// ----------------------------------------

const llm = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-pro-latest",
  streaming: true,
  callbacks: [
    {
      handleLLMNewToken(token) {
        console.log(token);
      },
    },
    {
      handleLLMEnd(output) {
        console.log(output);
      },
    },
  ],
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
  return { question, answer, sources };
};

// await generateAnswers({
//   askQuestion,
//   returnSources: true,
//   userInput: false,
// }); // Set userInput to true to get the User Input

await askQuestion("how many types of fixed deposit do you offer?");
