import { ChromaClient } from "chromadb";
import { config } from "dotenv";

config();

const reset = async () => {
  const client = new ChromaClient();
  await client.reset();
  console.log("Reset Successful.");
  return;
};

export { reset };
