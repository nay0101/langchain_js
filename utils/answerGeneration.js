import { createInterface } from "readline";

async function getAnswerAndSource(getQuestion, returnSources) {
  const { question, answer, sources } = await getQuestion;
  console.log(`Question: ${question}`);
  console.log(`Answer: ${answer}`);
  if (returnSources) {
    let tempSources = [];
    sources.map((source) => tempSources.push(source.metadata.source));
    const filterSources = tempSources.filter(
      (source, index) => tempSources.indexOf(source) === index
    );
    console.log("Sources:");
    filterSources.map((filteredSource) => console.log(filteredSource));
  }
}

function getUserInput(askQuestion, returnSources) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const userInput = () => {
    readline.question("Enter your question: ", async (question) => {
      if (question === "exit") return readline.close();
      await getAnswerAndSource(askQuestion(question), returnSources);
      userInput();
    });
  };

  return userInput();
}

async function generateAnswers({
  askQuestion,
  returnSources = false,
  userInput = false,
}) {
  if (userInput) return getUserInput(askQuestion, returnSources);

  const questions = [
    "what is fixed deposit?",
    "How many types of fixed deposit does HongLeong Bank provide?",
    "What is the difference between Fixed Deposit and eFixed Deposit?",
    "What are the interest rates for Fixed Deposit?",
    "Let's say I want to invest RM 50,000 in Fixed Deposit for 12 months. Please calculate the total amount that I can withdraw at the end of the term.",
  ];

  await getAnswerAndSource(askQuestion(questions[0]), returnSources);
  // await getAnswerAndSource(askQuestion(questions[1]), returnSources);
  // await getAnswerAndSource(askQuestion(questions[2]), returnSources);
  // await getAnswerAndSource(askQuestion(questions[3]), returnSources);
  // await getAnswerAndSource(askQuestion(questions[4]), returnSources);
}

export { generateAnswers };
