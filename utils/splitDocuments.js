import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

async function splitDocuments(docs, chunkSize = 2000, chunkOverlap = 200) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: chunkSize,
    chunkOverlap: chunkOverlap > chunkSize / 2 ? chunkSize / 2 : chunkOverlap,
    separators: ["</table>", "\n\n", "\n", " ", ""],
  });

  const transformer = new HtmlToTextTransformer();
  const sequence = splitter.pipe(transformer);
  const documents = await sequence.invoke(docs.flat());

  return { documents };
}

export { splitDocuments };
