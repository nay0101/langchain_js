import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { EmbeddingsFilter } from "langchain/retrievers/document_compressors/embeddings_filter";

function SimilarityThresholdRetriever({
  baseRetriever,
  embeddings,
  similarityThreshold,
}) {
  const baseCompressor = new EmbeddingsFilter({
    embeddings,
    similarityThreshold,
  });

  const retriever = new ContextualCompressionRetriever({
    baseCompressor,
    baseRetriever,
  });

  return retriever;
}

export { SimilarityThresholdRetriever };
