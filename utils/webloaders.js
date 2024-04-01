import { Document } from "langchain-core/documents";
import * as cheerio from "cheerio";
import { splitDocuments } from "./splitDocuments.js";
import puppeteer from "puppeteer";

async function useCheerio(urls, batchSize = 5) {
  const urlsToScrape = urls.filter((url, index) => urls.indexOf(url) === index);
  const docs = [];
  for (let i = 0; i < urlsToScrape.length; i += batchSize) {
    const batch = urlsToScrape.slice(i, i + batchSize);
    console.log(`Scraping:\n${batch.join(",").replaceAll(",", "\n")}`);
    const promises = batch.map(async (url) => {
      try {
        const response = await fetch(url);
        const $ = cheerio.load(await response.text());
        const result = $("body")
          .prop("innerText")
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .join(" ");
        const doc = new Document({
          pageContent: result,
          metadata: { source: url },
        });
        return doc;
      } catch (error) {
        console.log(`${url} - ${error.message}`);
        return false;
      }
    });
    const batchDocs = await Promise.all(promises);
    docs.push(...batchDocs);
  }
  console.log("Scraping Finished.");

  const { documents } = await splitDocuments(docs);

  return documents;
}

async function usePuppeteer(urls, batchSize = 5) {
  const urlsToScrape = urls.filter((url, index) => urls.indexOf(url) === index);
  const docs = [];
  const browser = await puppeteer.launch({ headless: "new" });
  for (let i = 0; i < urlsToScrape.length; i += batchSize) {
    const batch = urlsToScrape.slice(i, i + batchSize);
    console.log(`Scraping:\n${batch.join(",").replaceAll(",", "\n")}`);
    const promises = batch.map(async (url) => {
      const page = await browser.newPage();
      try {
        await page.goto(url, {
          waitUntil: "networkidle2",
        });

        const result = await page.evaluate(() => {
          const tagsToRemove = ["script", "style"];
          tagsToRemove.forEach((tag) => {
            document.querySelectorAll(tag).forEach((el) => el.remove());
          });
          const text = document.body.textContent;
          return text
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .join(" ");
        });

        await page.close();

        const doc = new Document({
          pageContent: result,
          metadata: { source: url },
        });
        return doc;
      } catch (error) {
        console.log(`${url} - ${error.message}`);
        await page.close();
        return false;
      }
    });
    const batchDocs = await Promise.all(promises);
    docs.push(...batchDocs);
  }

  await browser.close();

  const { documents } = await splitDocuments(docs);

  return documents;
}

export { useCheerio, usePuppeteer };
