import * as cheerio from "cheerio";
import { URL } from "url";
import { default as axios } from "axios";
import puppeteer from "puppeteer";

async function useCheerioWebCrawler(
  startingUrl,
  maxDepth = 0,
  urlsToExclude = []
) {
  const domainName = new URL(startingUrl).origin;
  const visitedUrls = new Set();
  let urlsToVisit = [startingUrl];
  let tempUrls = [];
  let finalUrls = [startingUrl];
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
        (url, index) =>
          finalUrls.indexOf(url) === index && !urlsToExclude.includes(url)
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
            !link.includes("#") &&
            !link.includes(".pdf") &&
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

  console.log(
    `Total URLS: ${finalUrls.length}\n${finalUrls
      .join(",")
      .replaceAll(",", "\n")}`
  );
  return finalUrls;
}

async function usePuppeteerWebCrawler(startingUrl, maxDepth = 0) {
  const domainName = new URL(startingUrl).origin;
  const visitedUrls = new Set();
  let urlsToVisit = [startingUrl];
  let tempUrls = [];
  let finalUrls = [];
  let depthCounter = 1;
  const browser = await puppeteer.launch({
    headless: "new",
  });

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

      const page = await browser.newPage();
      try {
        await page.goto(url, {
          waitUntil: "networkidle2",
        });

        const linksOnPage = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a")).map(
            (anchor) => anchor.href
          );
        });
        await page.close();

        for (const link of linksOnPage) {
          if (
            link &&
            isSameDomain(link) &&
            !visitedUrls.has(link) &&
            !link.includes("#") &&
            !link.includes(".pdf") &&
            (link.startsWith("/") || link.startsWith("https"))
          ) {
            const fullLink = link.startsWith("https")
              ? link
              : `${domainName}${link}`;
            tempUrls.push(fullLink);
            finalUrls.push(fullLink);
          }
        }

        await crawl();
      } catch (error) {
        console.log(error.message);
        await page.close();
        await crawl();
      }
    } catch (err) {
      return;
    }
  }

  await crawl();
  await browser.close();

  console.log(
    `Total URLS: ${finalUrls.length}\n${finalUrls
      .join(",")
      .replaceAll(",", "\n")}`
  );
  return finalUrls;
}

export { useCheerioWebCrawler, usePuppeteerWebCrawler };
