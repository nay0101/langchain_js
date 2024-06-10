import { config } from "dotenv";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferWindowMemory } from "langchain/memory";
import { useCheerio } from "../utils/webloaders.js";
import { getRetriever } from "../utils/vectorStore.js";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { reset } from "../reset.js";
import { useCheerioWebCrawler } from "../utils/webcrawler.js";
import { HuggingFaceInference } from "@langchain/community/llms/hf";
import { CallbackHandler } from "langfuse-langchain";

config();
await reset();
/* Create Training Data for Chatbot */
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

const urls = await useCheerioWebCrawler(
  "https://win066.wixsite.com/brillar-bank"
);

const documents = await useCheerio(urls);

// const embeddings = new HuggingFaceInferenceEmbeddings({
//   model: "mixedbread-ai/mxbai-embed-large-v1",
//   maxRetries: 0,
// });

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-large",
  dimensions: 1024,
});

const collectionName = "llama2_openai";
const retriever = await getRetriever({ documents, embeddings, collectionName });
// ----------------------------------------
const llm = new HuggingFaceInference({
  maxRetries: 0,
  // model: "meta-llama/Llama-2-70b-chat-hf",
  model: "meta-llama/Meta-Llama-3-70B-Instruct",
  maxTokens: 1000,
});

/* Creating Prompt */
const system_template = `
You are a helpful, respectful, and honest assistant. Answer exactly from the context.
Answer the question from the context below:
{context}
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

const langfuseHandler = new CallbackHandler();

/* Invoking Chain for Q&A */
const askQuestion = async (question) => {
  const result = await chain.invoke(
    {
      question,
      chat_history: memory,
    },
    { callbacks: [langfuseHandler] }
  );

  const answer = await result.text;
  const sources = await result.sourceDocuments;
  // console.log(sources);
  // console.log(answer);
  console.log(result);
  return { question, answer, sources };
};

await askQuestion("how many types of fixed deposit do you offer?");
await askQuestion("can you tell me about the second one?");
