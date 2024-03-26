import puppeteer from "puppeteer";
import { URL } from "url";

async function usePuppeteerWebCrawler(startingUrl, maxDepth = 1) {
  const domainName = new URL(startingUrl).origin;
  const visitedUrls = new Set();
  let urlsToVisit = [startingUrl];
  let tempUrls = [];
  let finalUrls = [];
  let depthCounter = 1;
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
        // Extract links directly using Puppeteer
        const linksOnPage = await page.evaluate(() => {
          return Array.from(document.querySelectorAll("a")).map(
            (anchor) => anchor.href
          );
        });

        page.close();
        for (const link of linksOnPage) {
          if (
            link &&
            isSameDomain(link) &&
            !visitedUrls.has(link) &&
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
        await crawl();
      }
    } catch (err) {
      return;
    }
  }

  await crawl();
  browser.close();

  return finalUrls;
}

export { usePuppeteerWebCrawler };
