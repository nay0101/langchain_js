import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";

config();

const model = new ChatOpenAI({
  modelName: "gpt-3.5-turbo-1106",
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

const chain = new ConversationChain({
  llm: model,
});

await chain.invoke({
  input: "what is fixed deposit?",
});
