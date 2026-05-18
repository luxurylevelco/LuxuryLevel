import { chromium, Page } from "playwright";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger";
import { delay } from "../utils/delay";
import { retry } from "../utils/retry";
import { discoverBrands } from "./discoverBrands";

export interface CollectLinksOptions {
  debug: boolean;
  limit?: number;
}

const excludedFragments = [
  "/brand/",
  "/product-category/",
  "/product-tag/",
  "/tag/",
  "/category/",
  "/page/",
  "/cart",
  "/checkout",
  "/my-account",
  "/account",
  "/wishlist",
];

const blockedSlugs = new Set([
  "shop",
  "brands",
  "jewellery",
  "jewelry",
  "bags",
  "blog",
  "about",
  "contact-us",
  "privacy-policy",
  "terms-condition",
  "refund_returns",
  "shipping-delivery",
  "pay-later",
  "watches-on-sale",
  "luxury-souq",
  "ls-bridal-jewelries",
  "ls-diamond-rings",
  "bracelet",
  "cufflinks",
  "order-tracking",
  "faq",
  "warranty-and-repair-policy",
  "hermes",
  "chanel",
]);

export async function collectProductLinks(
  page: Page,
  brandUrl: string,
  options: CollectLinksOptions
): Promise<string[]> {
  const visitedPages = new Set<string>();
  const productUrls = new Set<string>();

  let nextPageUrl: string | null = brandUrl;
  while (nextPageUrl) {
    if (visitedPages.has(nextPageUrl)) {
      break;
    }

    visitedPages.add(nextPageUrl);

    logger.info(`Collecting products from ${nextPageUrl}`);
    await retry(async () => {
      await page.goto(nextPageUrl as string, { waitUntil: "domcontentloaded", timeout: 60000 });
      await delay(500);
    }, { retries: 2, delayMs: 1000 });

    const links = await page
      .$$eval(
        "li.product a.woocommerce-LoopProduct-link, li.product a, .products a",
        (anchors) => Array.from(anchors).map((anchor) => (anchor as HTMLAnchorElement).href)
      )
      .catch(() => [] as string[]);

    for (const link of links) {
      if (isProductUrl(link)) {
        productUrls.add(link);
      }

      if (options.limit && productUrls.size >= options.limit) {
        break;
      }
    }

    if (options.limit && productUrls.size >= options.limit) {
      break;
    }

    nextPageUrl = await findNextPageUrl(page);

    if (options.debug) {
      logger.debug(`Page collected. Products so far: ${productUrls.size}`);
    }
  }

  return Array.from(productUrls);
}

function isProductUrl(url: string): boolean {
  if (!url.startsWith("https://luxurysouq.com/")) {
    return false;
  }

  if (excludedFragments.some((fragment) => url.includes(fragment))) {
    return false;
  }

  const path = new URL(url).pathname;
  const segments = path.split("/").filter(Boolean);
  if (segments.length !== 1) {
    return false;
  }

  const slug = segments[0];
  if (!slug || slug.length < 3) {
    return false;
  }

  if (blockedSlugs.has(slug)) {
    return false;
  }

  return true;
}

async function findNextPageUrl(page: Page): Promise<string | null> {
  const nextHref = await page
    .$eval("a.next, a.next.page-numbers, a.page-numbers.next", (anchor) =>
      (anchor as HTMLAnchorElement).href
    )
    .catch(() => null);

  if (nextHref) {
    return nextHref;
  }

  const relNext = await page
    .$eval("link[rel='next']", (link) => (link as HTMLLinkElement).href)
    .catch(() => null);

  if (relNext) {
    return relNext;
  }

  const paginationLinks = await page.$$eval("a.page-numbers", (anchors) =>
    Array.from(anchors).map((anchor) => (anchor as HTMLAnchorElement).href)
  );

  if (paginationLinks.length === 0) {
    return null;
  }

  const current = await page
    .$eval("span.page-numbers.current", (el) => (el as HTMLElement).textContent || "")
    .catch(() => "");

  const currentIndex = paginationLinks.findIndex((link) => link.includes(`/page/${current}/`));
  if (currentIndex >= 0 && currentIndex + 1 < paginationLinks.length) {
    return paginationLinks[currentIndex + 1];
  }

  return null;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const brandArg = process.argv.find((arg) => arg.startsWith("--brand="));
  const brandFilter = brandArg ? brandArg.split("=")[1] : undefined;

  (async () => {
    const brands = await discoverBrands({ headless: true, debug: false });
    const filtered = brandFilter
      ? brands.filter((brand) => brand.toLowerCase().includes(brandFilter.toLowerCase()))
      : brands;

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      locale: "en-US",
    });

    for (const brandUrl of filtered) {
      const page = await context.newPage();
      const links = await collectProductLinks(page, brandUrl, { debug: false });
      await page.close();
      logger.info(`${brandUrl}: ${links.length} products`);
    }

    await browser.close();
  })().catch((error) => {
    logger.error(`collectProductLinks failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
