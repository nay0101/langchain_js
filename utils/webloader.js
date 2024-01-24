import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { HtmlToTextTransformer } from "@langchain/community/document_transformers/html_to_text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { appendFile, writeFile } from "node:fs";
import * as cheerio from "cheerio";
import { Document } from "langchain-core/documents";

async function getDataFromUrls(urls) {
  const promises = urls.map(async (url) => {
    // const loader = new PuppeteerWebBaseLoader(url, {
    //   launchOptions: {
    //     headless: "new",
    //   },
    //   gotoOptions: {
    //     waitUntil: "domcontentloaded",
    //   },
    //   async evaluate(page, browser) {
    //     let result = await page.evaluate(() => {
    //       const tagsToRemove = ["script", "style"];
    //       tagsToRemove.forEach((tag) => {
    //         document.querySelectorAll(tag).forEach((el) => el.remove());
    //       });
    //       return document.body.textContent;
    //     });

    //     result = result
    //       .split("\n")
    //       .filter((line) => line.trim().length > 0)
    //       .join("\n");
    //     await browser.close();
    //     return result;
    //   },
    // });
    // const doc = await loader.load();
    // return doc;

    const response = await fetch(url);
    const $ = cheerio.load(await response.text());
    const result = $("body")
      .prop("innerText")
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join(" ");
    const doc = [
      new Document({
        pageContent: result,
        metadata: { source: url },
      }),
    ];
    return doc;
  });

  const docs = await Promise.all(promises);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1024,
    chunkOverlap: 20,
  });
  const transformer = new HtmlToTextTransformer();
  const sequence = splitter.pipe(transformer);
  const documents = await sequence.invoke(docs.flat());

  //Getting Logs
  writeFile("./log.html", "", (err) => {
    if (err) console.log(err);
  });
  documents.flat().forEach((d, i) => {
    appendFile(
      "./log.html",
      `\n${i}\n${d.metadata.source}\n${d.pageContent}\n`,
      (err) => {
        if (err) console.log(err);
      }
    );
  });

  return documents;
}

export { getDataFromUrls };
