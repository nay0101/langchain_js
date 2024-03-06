import * as cheerio from "cheerio";
import { URL } from "url";
import { default as axios } from "axios";

const startingUrl = "https://js.langchain.com/docs/integrations/platforms";
const domainName = new URL(startingUrl).hostname;
const visitedUrls = new Set();
const urlsToVisit = [startingUrl];

function isSameDomain(url) {
  try {
    const currentUrl = new URL(url);
    return currentUrl.hostname === domainName;
  } catch (error) {
    return false; // Not a valid URL
  }
}

function crawl() {
  if (urlsToVisit.length === 0) {
    console.log("Crawling finished.");
    return;
  }

  const url = urlsToVisit.pop();
  if (visitedUrls.has(url)) {
    crawl();
    return;
  }

  console.log(`Crawling ${url}`);
  visitedUrls.add(url);

  axios
    .get(url)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $("a").each((index, element) => {
        const link = $(element).attr("href");
        if (link && isSameDomain(link) && !visitedUrls.has(link)) {
          urlsToVisit.push(link);
        }
      });

      crawl(); // Proceed to the next URL in the queue
    })
    .catch((error) => {
      console.error(`Error crawling ${url}: `, error.message);
      crawl(); // Even if there's an error, proceed to the next URL
    });
}

crawl();
