import { createInterface } from "readline";

function getUserInput(askQuestion) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const userInput = () => {
    readline.question("Enter your question: ", async (question) => {
      if (question === "exit") return readline.close();
      const result = await askQuestion(question);
      console.log(result.text);
      userInput();
    });
  };

  return userInput();
}

export { getUserInput };
