import * as cheerio from "cheerio";
import { appendFile, write, writeFile } from "node:fs";
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer";
import { Document } from "langchain-core/documents";

const urls = [
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/fixed-deposit-account.html",
  "https://www.hlb.com.my/en/personal-banking/fixed-deposit/fixed-deposit-account/e-fixed-deposit.html",
];

const promises = urls.map(async (url) => {
  const response = await fetch(url);
  const $ = cheerio.load(await response.text());
  const result = $("body")
    .prop("innerText")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join(" ");
  writeFile("./testLoader.html", result, (err) => {
    if (err) console.log(err);
  });
  const docs = [
    new Document({
      pageContent: result,
      metadata: { source: url },
    }),
  ];
  return docs;
});
