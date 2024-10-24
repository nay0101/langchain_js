import {
  RunnableLambda,
  RunnableSequence,
  RunnablePassthrough,
} from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

function QuestionGeneratorChain({ llm }) {
  /**
   * Invocation Example
   * @example
   * const chain = QuestionGeneratorChain({ llm });
   * await chain.invoke({
   *  chat_history: chatHistory,
   *  context: context,
   *  n: 3,
   * });
   **/
  const prompt = `Generate {n} possible follow up questions based on the given chat history and context. You should follow the instructions below.

  - Don't answer the questions.
  - Don't include any introductory text, explanations, or follow-up sentences.
  - Don't number the question list.
  - Keep the questions short and direct. 
  - Only generate contextually answerable questions.
  - List the questions in a single line, separated by commas without whitespaces.

  Example response: What is a cat?,How many legs do they have?
  ---------------------------------------------------
  Chat History: {chat_history}
  Context: {context}
`;

  const promptTemplate = ChatPromptTemplate.fromTemplate(prompt);

  const getChatHistory = (inputs) => {
    return inputs.chat_history
      .map((history) => `${history.role} ${history.content}`)
      .join("\n");
  };

  const getContext = (inputs) => {
    return inputs.context[0].pageContent;
  };

  const getN = (inputs) => {
    return inputs.n;
  };

  const itemGetter = (inputs) => inputs;

  const chain = RunnableSequence.from([
    {
      chat_history: RunnableLambda.from(itemGetter).pipe(
        RunnableLambda.from(getChatHistory)
      ),
      context: RunnableLambda.from(itemGetter).pipe(
        RunnableLambda.from(getContext)
      ),
      n: RunnableLambda.from(itemGetter).pipe(RunnableLambda.from(getN)),
    },
    promptTemplate,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
}

export { QuestionGeneratorChain };
