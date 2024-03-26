import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { Document } from "langchain-core/documents";
import * as cheerio from "cheerio";
import { splitDocuments } from "./splitDocuments.js";
import { RecursiveUrlLoader } from "langchain/document_loaders/web/recursive_url";
import { compile } from "html-to-text";
import { promises as fs } from "node:fs";

async function useCheerio(urls) {
  const promises = urls.map(async (url) => {
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

  const { documents } = await splitDocuments(docs);

  return documents;
}

async function usePuppeteer(urls) {
  const promises = urls.map(async (url) => {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: {
        headless: "new",
      },
      gotoOptions: {
        waitUntil: "networkidle2",
      },
      async evaluate(page, browser) {
        let result = await page.evaluate(() => {
          const tagsToRemove = ["script", "style"];
          tagsToRemove.forEach((tag) => {
            document.querySelectorAll(tag).forEach((el) => el.remove());
          });
          return document.body.textContent;
        });

        result = result
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .join("\n");
        await browser.close();
        return result;
      },
    });
    const doc = await loader.load();
    return doc;
  });

  const docs = await Promise.all(promises);

  const { documents } = await splitDocuments(docs);

  return documents;
}

async function useRecursiveUrlLoader(url) {
  const compiledConvert = compile({ wordwrap: 130 });
  const loader = new RecursiveUrlLoader(url, {
    extractor: compiledConvert,
    maxDepth: 2,
    excludeDirs: ["https://js.langchain.com/docs/modules"],
  });

  const docs = await loader.load();

  const { documents } = await splitDocuments(docs);

  return documents;
}

export { useCheerio, usePuppeteer, useRecursiveUrlLoader };
