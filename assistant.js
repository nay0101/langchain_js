import { config } from "dotenv";
import { OpenAIAssistantRunnable } from "langchain/experimental/openai_assistant";
import { OpenAIFiles } from "langchain/experimental/openai_files";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";

config();

const model = "gpt-4-1106-preview";
const instructions = `You are a helpful assistant to answer the questions related to the files uploaded regarding Brillar Bank fixed deposit.
  Show the interest rate starting with \n and line by line whenever you answer it.
  Don't give references and sources
  After calculating the total interest rate, just answer the exact result and don't provide calculation steps.
  You can only answer questions based on available context.  If a user asks questions not related to the topic, please answer " "Sorry I am not able to answer that. I can only answer topics related to Brillar Bank".
  If the bank's name is not provided in the question, answer with the assumption that the question is about Brillar Bank.
  Whenever you give the answer, say "Thank you for choosing Brillar Bank"
`;
const tools = [{ type: "retrieval" }];

const openAIFiles = new OpenAIFiles();
const file = await openAIFiles.createFile({
  file: createReadStream("./sources/Fixed Deposit - HLB.pdf"),
  purpose: "assistants",
});

const createAssistant = async (name) => {
  const assistant = await OpenAIAssistantRunnable.createAssistant({
    name,
    model,
    instructions,
    tools,
    fileIds: [file.id],
  });

  return assistant;
};

const retrieveAssistantInfo = async (assistantId) => {
  const assistant = new OpenAIAssistantRunnable({
    assistantId,
  });

  const response = await assistant.getAssistant();

  return response;
};

const modifyAssistant = async (assistantId) => {
  const assistant = new OpenAIAssistantRunnable({
    assistantId,
  });

  const modifiedAssistant = await assistant.modifyAssistant({
    name: "Modified In LangChain",
  });

  return modifiedAssistant;
};

const deleteAssistant = async (assistantId) => {
  const assistant = new OpenAIAssistantRunnable({
    assistantId,
  });

  const response = await assistant.deleteAssistant();

  return response;
};

const getExistingAssistant = (assistantId) => {
  const assistant = new OpenAIAssistantRunnable({
    assistantId,
  });

  return assistant;
};

const assistant = getExistingAssistant("asst_4q1BgcdvwojkDEBD4E3Eahrf");
const response = await assistant.invoke({
  content: "what is fixed deposit?",
});

console.log(response[0].content[0].text.value);
