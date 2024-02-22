import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationChain } from "langchain/chains";

config();

const model = new ChatOpenAI({
  streaming: true,
  callbacks: [
    {
      handleLLMNewToken(token) {
        console.log(token);
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
