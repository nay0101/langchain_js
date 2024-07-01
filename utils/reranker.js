import { config } from "dotenv";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { CohereRerank } from "@langchain/cohere";

config();

const reranker = (retriever) => {
  const rerankerModel = new CohereRerank({
    model: "rerank-multilingual-v3.0",
  });

  const reranker = new ContextualCompressionRetriever({
    baseCompressor: rerankerModel,
    baseRetriever: retriever,
  });

  return reranker;
};

export { reranker };
