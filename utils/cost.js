import { config } from "dotenv";
import { Langfuse } from "langfuse-langchain";

config();

async function getTotalCost({ chatbotName, fromTimestamp, toTimestamp }) {
  const langfuse = new Langfuse();
  const langfuseConfig = {
    userId: chatbotName,
    fromTimestamp: fromTimestamp,
    toTimestamp: toTimestamp,
  };

  const totalPages = (await langfuse.fetchTraces({ ...langfuseConfig })).meta
    .totalPages;

  let cost = 0;
  for (let pageNumber = 0; pageNumber < totalPages; pageNumber++) {
    const traces = await langfuse.fetchTraces({
      page: pageNumber + 1,
      ...langfuseConfig,
    });

    traces.data.forEach((trace) => {
      cost += trace.totalCost;
    });
  }

  const roundedCost = parseFloat(cost.toFixed(6));

  return roundedCost;
}

export { getTotalCost };
