import { Pinecone } from "@pinecone-database/pinecone";

async function initializePinecone(index_name, namespace) {
  const pinecone = new Pinecone();
  const indexList = await pinecone.listIndexes();

  if (indexList.every((index) => index.name !== index_name)) {
    pinecone.createIndex({
      name: index_name,
      metric: "cosine",
      dimension: 1536,
    });
  }

  const pineconeIndex = pinecone.Index(index_name);
  await pineconeIndex.deleteAll(namespace);
  return pineconeIndex;
}

export default initializePinecone;
