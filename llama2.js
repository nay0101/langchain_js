import { config } from "dotenv";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferWindowMemory } from "langchain/memory";
import { useCheerio } from "./utils/webloaders.js";
import { getRetriever } from "./utils/vectorStore.js";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";

config();

/* Create Training Data for Chatbot */
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

const documents = await useCheerio(urls);

const embeddings = new HuggingFaceInferenceEmbeddings({
  model: "hkunlp/instructor-base",
  maxRetries: 0,
  maxConcurrency: 10,
});

const collectionName = "llama2_instruct-base";
const retriever = await getRetriever(documents, embeddings, collectionName);
// ----------------------------------------
const llm = new HuggingFaceInference({
  model: "meta-llama/Llama-2-70b-chat-hf",
  maxTokens: 1000,
});

/* Creating Prompt */
const system_template = `[INST] <<SYS>>
You are a helpful, respectful, and honest assistant. Answer exactly from the context.
<</SYS>>
Answer the question from the context below:
{context}

Question: {question} [/INST]
`;

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
  console.log(answer);
  return { question, answer, sources };
};

await askQuestion("what are the interest rates for fixed deposit?");
