import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as fs from "node:fs";

async function splitDocuments(docs) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 20,
  });
  const transformer = new HtmlToTextTransformer();
  const sequence = splitter.pipe(transformer);
  const documents = await sequence.invoke(docs.flat());

  /* Getting Logs */
  // fs.writeFile("./logs/dataloaderLog.txt", "", (err) => {
  //   if (err) console.log(err);
  // });

  // documents.flat().forEach((d, i) => {
  //   fs.appendFile(
  //     "./logs/dataloaderLog.txt",
  //     `\n${i}\n${d.metadata.source}\n${d.pageContent}\n`,
  //     (err) => {
  //       if (err) console.log(err);
  //     }
  //   );
  // });

  return { documents };
}

export { splitDocuments };
