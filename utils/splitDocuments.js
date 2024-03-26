import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

async function splitDocuments(docs, chunkSize = 1024, chunkOverlap = 20) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize,
    chunkOverlap: chunkOverlap > chunkSize / 2 ? chunkSize / 2 : chunkOverlap,
  });
  const transformer = new HtmlToTextTransformer();
  const sequence = splitter.pipe(transformer);
  const documents = await sequence.invoke(docs.flat());

  return { documents };
}

export { splitDocuments };
