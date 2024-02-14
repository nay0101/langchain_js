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
import { RetrievalQAChain } from "langchain/chains";
import { BufferWindowMemory } from "langchain/memory";
import { usePuppeteer } from "../utils/webloaders.js";
import { getRetriever } from "../utils/vectorStore.js";
import { generateAnswers } from "../utils/answerGeneration.js";
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
const documents = await usePuppeteer(urls);

const embeddings = new GoogleGenerativeAIEmbeddings({
  modelName: "embedding-001",
});

const collectionName = "crc_chain_js_gemini_retrieval";
const retriever = await getRetriever(documents, embeddings, collectionName);
// ----------------------------------------

const llm = new ChatGoogleGenerativeAI({ modelName: "gemini-pro" });

/* Creating Compression Retriever for Accurate Results */
const embeddings_filter = new EmbeddingsFilter({
  embeddings,
  similarityThreshold: 0.7,
  k: 10,
});

const compression_retriever = new ContextualCompressionRetriever({
  baseCompressor: embeddings_filter,
  baseRetriever: retriever,
});

/* Creating Question Chain */
const chain = RetrievalQAChain.fromLLM(llm, retriever);

/* Invoking Chain for Q&A */
const askQuestion = async (question) => {
  const result = await chain.invoke({
    query: question,
  });
  const answer = await result.text;
  const sources = await result.sourceDocuments;

  return { question, answer, sources };
};

await generateAnswers({
  askQuestion,
  returnSources: true,
  userInput: false,
}); // Set userInput to true to get the User Input
