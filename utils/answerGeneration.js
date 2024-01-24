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

async function generateAnswers({ askQuestion, userInput = false }) {
  if (userInput) return getUserInput(askQuestion);

  const questions = [
    "what is fixed deposit?",
    "How many types of fixed deposit does HongLeong Bank provide?",
    "What is the difference between Fixed Deposit and eFixed Deposit?",
    "What are the interest rates for Fixed Deposit?",
    "Let's say I want to invest RM 50,000 in Fixed Deposit for 12 months. Please calculate the total amount that I can withdraw at the end of the term.",
  ];

  console.log(
    `Q: ${questions[0]}\nA: ${(await askQuestion(questions[0])).text}\n`
  );
  console.log(
    `Q: ${questions[1]}\nA: ${(await askQuestion(questions[1])).text}\n`
  );
  console.log(
    `Q: ${questions[2]}\nA: ${(await askQuestion(questions[2])).text}\n`
  );
  console.log(
    `Q: ${questions[3]}\nA: ${(await askQuestion(questions[3])).text}\n`
  );
  console.log(
    `Q: ${questions[4]}\nA: ${(await askQuestion(questions[4])).text}\n`
  );
}

export { generateAnswers };
