import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ConversationSummaryBufferMemory } from "langchain/memory";
import getDataFromUrls from "./webloader.js";
import initializePinecone from "./pineconeConfig.js";
import getRetriever from "./vectorStore.js";
import getUserInput from "./userInput.js";

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
const documents = await getDataFromUrls(urls);

const index_name = "main-index";
const namespace = "hlb-fixed-deposit-js";
const pineconeIndex = await initializePinecone(index_name, namespace);

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-ada-002",
});
const retriever = await getRetriever(
  documents,
  embeddings,
  pineconeIndex,
  namespace
);

const llm = new ChatOpenAI({
  modelName: "gpt-4-1106-preview",
  temperature: 0,
});

const prompt_template = `
  You are a helpful assistant who should reply to inputs related only to the HongLeong Bank aka HLB.
  You answer to the question: {question}
  By only basing on this context: {context}
  If you don't have enought information from the document, don't answer with your general knowledge, just say you don't have that information.
  Your answer should be detailed but if you have to do calculation, don't show your work or equations, double check your answer, just provide the final value, and you don't need to show reference.
  If the bank's name is not provided in the input, answer with the assumption that the question is about HLB.
  If the bank's name is provided and it's not HLB, don't answer that question.
  You don't need to answer if the input requires you to do something creative such as writing a song or making a joke.
`;

const prompt = new PromptTemplate({
  template: prompt_template,
  inputVariables: ["question", "context"],
});

const memory = new ConversationSummaryBufferMemory({
  llm,
  memoryKey: "chat_history",
  inputKey: "question",
  maxTokenLimit: 1000,
  returnMessages: true,
});

const chain = ConversationalRetrievalQAChain.fromLLM(llm, retriever, {
  memory,
  inputKey: "question",
  qaChainOptions: {
    prompt: prompt,
    type: "stuff",
  },
});

const askQuestion = async (question) => {
  const answer = await chain.invoke({
    question,
    chat_history: memory,
  });
  return answer;
};

getUserInput(askQuestion);
