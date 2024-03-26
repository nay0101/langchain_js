import * as cheerio from "cheerio";
import { URL } from "url";
import { default as axios } from "axios";
import fs from "node:fs";

async function useWebCrawler(startingUrl, maxDepth = 0) {
  const domainName = new URL(startingUrl).origin;
  const visitedUrls = new Set();
  let urlsToVisit = [startingUrl];
  let tempUrls = [];
  let finalUrls = [];
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
      console.log("Crawling finished.");
      return;
    }

    if (urlsToVisit.length === 0 && depthCounter <= maxDepth) {
      console.log(`Depth: ${depthCounter}`);
      depthCounter += 1;
      urlsToVisit = [...tempUrls];
      tempUrls = [];
    }

    try {
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
        let tempUrl;

        $("a").each((index, element) => {
          const link = $(element).attr("href");
          if (
            link &&
            isSameDomain(link) &&
            !visitedUrls.has(link) &&
            (link.startsWith("/") || link.startsWith("https"))
          ) {
            if (link.startsWith("https")) {
              tempUrl = link;
            }
            if (!link.startsWith("https")) {
              tempUrl = `${domainName}${link}`;
            }
            tempUrls.push(tempUrl);
            finalUrls.push(tempUrl);
          }
        });
        await crawl();
      } catch (error) {
        console.log(error.message);
        await crawl();
      }
    } catch (err) {
      return;
    }
  }

  await crawl();
  finalUrls.forEach((url) => {
    fs.appendFile("./test.txt", `${url}\n`, (err) => {
      if (err) console.log(err);
    });
  });
  return finalUrls;
}

export { useWebCrawler };
