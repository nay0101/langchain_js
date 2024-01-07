import { PineconeStore } from "@langchain/community/vectorstores/pinecone";

async function getRetriever(documents, embeddings, pineconeIndex, namespace) {
  const vector = await PineconeStore.fromDocuments(documents, embeddings, {
    pineconeIndex,
    namespace,
    maxConcurrency: 5,
  });

  const retriever = vector.asRetriever({
    k: 5,
    searchType: "similarity",
  });

  return retriever;
}

export default getRetriever;
