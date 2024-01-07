import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { appendFile } from "node:fs";

async function getDataFromUrls(urls) {
  const promises = urls.map(async (url) => {
    const loader = new CheerioWebBaseLoader(url);
    const doc = await loader.load();
    return doc;
  });

  const docs = await Promise.all(promises);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 50,
  });

  const transformer = new HtmlToTextTransformer();
  const sequence = splitter.pipe(transformer);
  const documents = await sequence.invoke(docs.flat());
  documents.forEach((d) => {
    appendFile("./test.txt", `\n${d.pageContent}`, (err) => console.log(err));
  });
  return documents;
}

export default getDataFromUrls;
