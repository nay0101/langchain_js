import * as cheerio from "cheerio";
import { URL } from "url";
import { default as axios } from "axios";
import * as fs from "node:fs";

const startingUrl = "https://js.langchain.com/docs/";
const domainName = new URL(startingUrl).origin;
const visitedUrls = new Set();
let urlsToVisit = [startingUrl];
let storedUrls = [];
let finalUrls = [];
const maxDepth = 1;
let depthCounter = 1;

function isSameDomain(url) {
  try {
    const currentUrl = new URL(url);
    return currentUrl.origin === domainName;
  } catch (error) {
    return true;
  }
}

async function crawl() {
  if (urlsToVisit.length === 0 && depthCounter > maxDepth) {
    finalUrls = finalUrls.filter(
      (url, index) => finalUrls.indexOf(url) === index
    );
    finalUrls.forEach((url) => {
      fs.appendFile("./webcrawler1.txt", `${url}\n`, (err) => {
        if (err) console.log(err);
      });
    });
    console.log("Crawling finished.");
    return;
  }

  if (urlsToVisit.length === 0 && depthCounter <= maxDepth) {
    console.log("URLs Increase");
    depthCounter += 1;
    urlsToVisit = [...storedUrls];
    storedUrls = [];
  }

  const url = urlsToVisit.pop();
  if (visitedUrls.has(url)) {
    await crawl();
    return;
  }

  console.log(`Crawling ${url}`);
  visitedUrls.add(url);

  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    $("a").each((index, element) => {
      const link = $(element).attr("href");
      if (
        link &&
        isSameDomain(link) &&
        !visitedUrls.has(link) &&
        !link.startsWith("#")
      ) {
        let tempUrl;
        if (link.startsWith("https")) {
          tempUrl = link;
        }
        if (!link.startsWith("https")) {
          tempUrl = `${domainName}${link}`;
        }
        storedUrls.push(tempUrl);
        finalUrls.push(tempUrl);
      }
    });
    await crawl();
  } catch (error) {
    console.log(error.message);
    await crawl();
  }
}

await crawl();
