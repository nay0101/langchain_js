import { config } from "dotenv";
import { Langfuse } from "langfuse-langchain";

config();

async function getTotalCost({ chatbotName }) {
  const langfuse = new Langfuse();
  const totalPages = (await langfuse.fetchTraces({ userId: chatbotName })).meta
    .totalPages;

  let cost = 0;
  for (let pageNumber = 0; pageNumber < totalPages; pageNumber++) {
    const traces = await langfuse.fetchTraces({
      userId: chatbotName,
      page: pageNumber + 1,
    });

    traces.data.forEach((trace) => {
      cost += trace.totalCost;
    });
  }

  const roundedCost = parseFloat(cost.toFixed(6));

  return roundedCost;
}

export { getTotalCost };
