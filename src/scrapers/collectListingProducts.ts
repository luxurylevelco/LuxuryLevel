import { Page } from "playwright";
import { extractRefFromSlug, normalizeRef } from "../utils/normalize";
import { logger } from "../utils/logger";
import { delay } from "../utils/delay";
import { retry } from "../utils/retry";
import { extractPrice } from "../utils/extractPrice";

export interface ListingProduct {
  product_url: string;
  scraped_name: string;
  normalized_ref_no: string | null;
  raw_category_name: string | null;
  scraped_price: number | null;
  currency: string | null;
}

export interface CollectListingOptions {
  debug: boolean;
  limit?: number;
  category?: string;
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
  "channel",
]);

export async function collectListingProducts(
  page: Page,
  startUrl: string,
  options: CollectListingOptions
): Promise<ListingProduct[]> {
  const visitedPages = new Set<string>();
  const products = new Map<string, ListingProduct>();

  let nextPageUrl: string | null = startUrl;
  while (nextPageUrl) {
    if (visitedPages.has(nextPageUrl)) {
      break;
    }

    visitedPages.add(nextPageUrl);
    logger.info(`Collecting listing products from ${nextPageUrl}`);

    await retry(async () => {
      await page.goto(nextPageUrl as string, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForSelector("li.product, .products", { timeout: 5000 }).catch(() => undefined);
      await delay(500);
    }, { retries: 2, delayMs: 1000 });

    if (page.isClosed()) {
      logger.warn("Listing page closed unexpectedly. Stopping listing collection.");
      break;
    }

    const items = await page
      .$$eval(
        "li.product a.woocommerce-LoopProduct-link, li.product a, .products a, .product a",
        (anchors) =>
          Array.from(anchors)
            .filter((a) => {
              try {
                const href = (a as HTMLAnchorElement).href || "";
                if (!href || href.includes("add-to-cart") || href.startsWith("javascript:")) {
                  return false;
                }
                return true;
              } catch {
                return false;
              }
            })
            .map((anchor) => {
              const link = anchor as HTMLAnchorElement;
              const container =
                link.closest("li.product, .product, [class*='product-'], [class*='product']") ||
                link.parentElement ||
                link;

              const nameEl =
                container?.querySelector("h2.woocommerce-loop-product__title") ||
                container?.querySelector("h3") ||
                container?.querySelector(".product-title") ||
                container?.querySelector(".woocommerce-loop-product__title") ||
                container?.querySelector(".product-name") ||
                link.querySelector("h2, h3");

              const listingCard =
                link.closest("li.product, .product, .products > .product, .products li, [class*='product-'], [class*='products']") ||
                container;

              const priceEl =
                listingCard?.querySelector(
                  ".woocommerce-loop-product__title + .price, .woocommerce-loop-product__price, .price," +
                    " .woocommerce-Price-amount, .woocommerce-Price-amount bdi, .amount, bdi, " +
                    " span.woocommerce-Price-amount, .product-details .price," +
                    " .price del, .price ins"
                ) ||
                link.querySelector(
                  ".price, .woocommerce-Price-amount, .amount, bdi, .woocommerce-loop-product__price"
                );

              // 🚀 FIX: Idinagdag ang .add_to_cart_button dahil standard WooCommerce class ito
              const addToCart = container?.querySelector("a[href*='add-to-cart'], button[name='add-to-cart'], .add_to_cart_button") as
                | HTMLAnchorElement
                | HTMLButtonElement
                | null;

              const nameText =
                nameEl?.textContent?.trim() ||
                link.getAttribute("title") ||
                link.getAttribute("aria-label") ||
                link.textContent?.trim() ||
                addToCart?.getAttribute("data-product_name") ||
                addToCart?.getAttribute("aria-label") ||
                addToCart?.getAttribute("title") ||
                "";

              // 🚀 FIX: Kukunin na natin yung exact SKU galing sa hidden attributes ng website!
              const exactSku = 
                addToCart?.getAttribute("data-product_sku") || 
                container?.getAttribute("data-sku") || 
                "";

              return {
                href: link.href || "",
                name: nameText,
                priceText: priceEl?.textContent?.trim() || "",
                sku: exactSku, // 👈 Ipinasa natin ang exact SKU sa return object
              };
            })
      )
      .catch(() => [] as Array<{ href: string; name: string; priceText: string; sku: string }>);

    if (options.debug && items.length === 0) {
      const anchorSample = await page
        .$$eval("a", (anchors) => anchors.map((a) => (a as HTMLAnchorElement).href).slice(0, 10))
        .catch(() => [] as string[]);
      logger.debug(`No listing items found. Anchor sample: ${anchorSample.join(" | ")}`);
    }

    for (const item of items) {
      if (!isProductUrl(item.href)) {
        continue;
      }
      if (products.has(item.href)) {
        continue;
      }

      const displayName = item.name || slugToName(item.href) || "Unknown Product";
      
      // 🚀 FIX: Ang ating bagong Priority Logic!
      // 1. Unahin ang exact SKU kung nahanap sa HTML
      let normalizedRef = item.sku ? normalizeRef(item.sku) : null;
      
      // 2. Kung wala talaga sa HTML, doon lang siya manghuhula sa URL
      if (!normalizedRef) {
        normalizedRef = extractRefFromSlug(new URL(item.href).pathname);
      }
      // 3. Kung wala pa rin at bag ito, doon lang manghuhula sa pangalan
      if (!normalizedRef && options.category === "bags") {
        normalizedRef = extractBagRefFromName(displayName);
      }

      const priceText = item.priceText?.trim() || null;
      const price = extractPrice(priceText);
      products.set(item.href, {
        product_url: item.href,
        scraped_name: displayName,
        normalized_ref_no: normalizedRef,
        raw_category_name: options.category || null,
        scraped_price: price.value,
        currency: price.currency,
      });

      if (options.limit && products.size >= options.limit) {
        break;
      }
    }

    if (options.limit && products.size >= options.limit) {
      break;
    }

    nextPageUrl = await findNextPageUrl(page);

    if (options.debug) {
      logger.debug(`Listing page collected. Products so far: ${products.size}`);
    }
  }

  return Array.from(products.values());
}

function slugToName(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    if (!slug) {
      return null;
    }
    const words = slug.split("-").filter(Boolean);
    if (words.length === 0) {
      return null;
    }
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  } catch {
    return null;
  }
}

function extractBagRefFromName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) {
    return null;
  }

  const refTokens = tokens.slice(1, 5);
  if (refTokens.length === 0) {
    return null;
  }

  return normalizeRef(refTokens.join(" ")) || null;
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
