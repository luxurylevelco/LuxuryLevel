import { Page } from "playwright";
import { ScrapedProduct } from "../types/product";
import { extractPrice } from "../utils/extractPrice";
import { extractRefFromSlug, extractRefFromText, normalizeRef } from "../utils/normalize";
import { logger } from "../utils/logger";
import { delay } from "../utils/delay";
import { retry } from "../utils/retry";

export interface ScrapeProductOptions {
  debug: boolean;
}

export async function scrapeProduct(
  page: Page,
  productUrl: string,
  options: ScrapeProductOptions
): Promise<ScrapedProduct> {
  const baseProduct: ScrapedProduct = {
    product_url: productUrl,
    scraped_ref_no: null,
    normalized_ref_no: null,
    scraped_name: "",
    scraped_price: null,
    currency: null,
    raw_brand_name: null,
    raw_category_name: null,
    description: null,
    color: null,
    gender: null,
    stock_status: null,
    image_url: null,
    image_url_2: null,
    image_url_3: null,
    all_images: [],
    specifications: {},
    scraped_at: new Date().toISOString(),
    scrape_success: false,
    error_message: null,
  };

  try {
    await retry(async () => {
      await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await delay(600);
    }, { retries: 2, delayMs: 1200 });

    const hasSingleProductClass = await page
      .$("body.single-product")
      .then((el) => Boolean(el))
      .catch(() => false);
    const hasProductTitle = await page
      .$("h1.product_title, h1.entry-title")
      .then((el) => Boolean(el))
      .catch(() => false);
    const hasGallery = await page
      .$(".woocommerce-product-gallery")
      .then((el) => Boolean(el))
      .catch(() => false);

    const isProductPage = hasSingleProductClass || (hasProductTitle && hasGallery);
    if (!isProductPage) {
      baseProduct.scrape_success = false;
      baseProduct.error_message = "Not a product page";
      logger.warn(`Skipping non-product page: ${productUrl}`);
      return baseProduct;
    }

    const title = await page
      .$eval("h1.product_title, h1.entry-title", (el) => (el as HTMLElement).textContent || "")
      .catch(() => "");
    baseProduct.scraped_name = title.trim() || "Unknown Product";

    const priceText = await page
      .$eval(".summary .price, p.price", (el) => (el as HTMLElement).textContent || "")
      .catch(() => "");
    const price = extractPrice(priceText);
    baseProduct.scraped_price = price.value;
    baseProduct.currency = price.currency;

    const stockStatus = await page
      .$eval(".stock", (el) => (el as HTMLElement).textContent || "")
      .catch(() => "");
    baseProduct.stock_status = stockStatus.trim() || null;

    baseProduct.specifications = await extractSpecifications(page);
    baseProduct.description = await extractDescription(page);

    if (!baseProduct.description || baseProduct.description.length === 0) {
      baseProduct.description = formatSpecifications(baseProduct.specifications);
    }

    const images = await extractImages(page);
    baseProduct.all_images = images;
    baseProduct.image_url = images[0] || null;
    baseProduct.image_url_2 = images[1] || null;
    baseProduct.image_url_3 = images[2] || null;

    const brand = findSpecValue(baseProduct.specifications, ["brand"]);
    const category = findSpecValue(baseProduct.specifications, ["category", "collection"]);
    const breadcrumbs = await extractBreadcrumbs(page);
    const meta = await extractProductMeta(page);

    const slugBrand = extractBrandFromSlug(productUrl);
    const titleBrand = extractBrandFromTitle(baseProduct.scraped_name);

    const resolvedBrand = brand || meta.brand || slugBrand || titleBrand || null;
    const breadcrumbCategory = pickCategoryFromCrumbs(breadcrumbs.crumbs);
    baseProduct.raw_brand_name = resolvedBrand;
    baseProduct.raw_category_name = pickCategory([
      category,
      meta.category,
      breadcrumbCategory,
      breadcrumbs.category,
      breadcrumbs.fallbackCategory,
    ], resolvedBrand);

    baseProduct.color = findSpecValue(baseProduct.specifications, ["color", "dial color"]);
    baseProduct.gender = findSpecValue(baseProduct.specifications, ["gender", "sex"]);

    // Hard override: if scraped name/description clearly indicates a bag, normalize category to "Bags"
    // This fixes cases where the site posts "Channel" or other incorrect categories for bag pages (e.g. Chanel).
    const nameLower = baseProduct.scraped_name.toLowerCase();
    const descLower = (baseProduct.description || "").toLowerCase();
    const rawCategoryLower = (baseProduct.raw_category_name || "").toLowerCase();

    const watchLikeKeywords = ["watch", "timepiece", "chronograph", "movement", "dial"];
    const isWatchLike = watchLikeKeywords.some((k) => `${nameLower} ${descLower} ${rawCategoryLower}`.includes(k));

    const bagLikeKeywordsRegex = /(\bluxury\s*handbag\b|\bluxurybag\b|\bhandbag(s)?\b|\bbag(s)?\b|\bpurse\b|\bwallet\b|\bclutch\b|\btote\b|\bsatchel\b)/i;
    const isBagLike = bagLikeKeywordsRegex.test(`${nameLower} ${descLower} ${rawCategoryLower}`);

    if (isBagLike && !isWatchLike) {
      baseProduct.raw_category_name = "Bags";
    }

    const refFromSpecs = findSpecValue(baseProduct.specifications, [
      "reference",
      "reference no",
      "ref",
      "model",
      "model number",
    ]);

    // 🚀 BAGONG LOGIC: Taga-kuha ng EXAKTONG SKU mula sa nakatagong table (Galing sa Inspect mo!)
    const exactTableRefNo = await page.$$eval('.retail-price-table_x tr', (rows) => {
      for (const row of rows) {
        const label = row.querySelector('.label_x')?.textContent?.trim() || "";
        if (label.includes('Ref. No') || label.includes('Reference')) {
          return row.querySelector('.value_x')?.textContent?.trim() || null;
        }
      }
      return null;
    }).catch(() => null);

    const refFromUrl = extractRefFromSlug(new URL(productUrl).pathname);
    const refFromTitle = extractRefFromText(baseProduct.scraped_name);
    
    // 🚀 BAGONG PRIORITY: Uunahin na nating isalba at gamitin si exactTableRefNo!
    let scrapedRef = exactTableRefNo || refFromSpecs || refFromUrl || refFromTitle;
    
    if (isBagsCategory(baseProduct.raw_category_name)) {
      if (exactTableRefNo) {
        scrapedRef = exactTableRefNo; // Prio 1 kung may table
      } else if (refFromUrl) {
        scrapedRef = refFromUrl;
      } else if (!scrapedRef) {
        scrapedRef = extractBagRefFromName(baseProduct.scraped_name, resolvedBrand);
      }
    }

    baseProduct.scraped_ref_no = scrapedRef || null;
    baseProduct.normalized_ref_no = scrapedRef ? normalizeRef(scrapedRef) : null;

    baseProduct.scrape_success = true;
    baseProduct.error_message = null;

    if (options.debug) {
      logger.debug(`Scraped ${productUrl}`);
    }

    return baseProduct;
  } catch (error) {
    baseProduct.scrape_success = false;
    baseProduct.error_message = error instanceof Error ? error.message : String(error);
    logger.warn(`Failed scraping ${productUrl}: ${baseProduct.error_message}`);
    return baseProduct;
  }
}

function isBagsCategory(category: string | null): boolean {
  if (!category) {
    return false;
  }
  const value = category.toLowerCase();
  return value.includes("bag");
}

function extractBagRefFromName(name: string, brand: string | null): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }

  let tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) {
    return null;
  }

  if (brand) {
    const brandTokens = brand.split(/\s+/).filter(Boolean).map((token) => token.toLowerCase());
    const lowered = tokens.map((token) => token.toLowerCase());
    let offset = 0;
    while (offset < brandTokens.length && lowered[offset] === brandTokens[offset]) {
      offset += 1;
    }
    if (offset > 0) {
      tokens = tokens.slice(offset);
    }
  }

  const refTokens = tokens.slice(0, 4);
  if (refTokens.length === 0) {
    return null;
  }

  return normalizeRef(refTokens.join(" ")) || null;
}

async function extractSpecifications(page: Page): Promise<Record<string, string>> {
  const tableData = await page
    .$eval("table.shop_attributes", (table) => {
      const rows = Array.from(table.querySelectorAll("tr"));
      const data: Record<string, string> = {};
      for (const row of rows) {
        const key = row.querySelector("th")?.textContent?.trim();
        const value = row.querySelector("td")?.textContent?.trim();
        if (key && value) {
          data[key] = value;
        }
      }
      return data;
    })
    .catch(() => ({} as Record<string, string>));

  const listData = await page
    .$$eval(
      "#content_tab_description li, #tab-description li, .woocommerce-product-details__short-description li",
      (items) => {
        const data: Record<string, string> = {};
        for (const item of items) {
          const element = item as HTMLElement;
          const strongs = Array.from(element.querySelectorAll("strong, b"));

          if (strongs.length > 0) {
            const label = strongs
              .map((node) => node.textContent?.trim() || "")
              .filter(Boolean)
              .join(" ")
              .replace(/:$/, "")
              .trim();
            const rawText = element.textContent || "";
            const value = rawText
              .replace(label, "")
              .replace(/^\s*:\s*/, "")
              .trim();
            if (label && value) {
              data[label] = value;
              continue;
            }
          }

          const text = element.textContent || "";
          const parts = text.split(":");
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(":").trim();
            if (key && value) {
              data[key] = value;
            }
          }
        }

        return data;
      }
    )
    .catch(() => ({} as Record<string, string>));

  return { ...listData, ...tableData };
}

async function extractDescription(page: Page): Promise<string | null> {
  const cleanedContainerText = await page
    .$eval("#content_tab_description", (root) => {
      const clone = root.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("ul, ol, li").forEach((node) => node.remove());
      clone.querySelectorAll("h1, h2, h3, h4").forEach((node) => {
        const text = node.textContent?.toLowerCase() || "";
        if (text.includes("watch specifications")) {
          node.remove();
        }
      });
      return clone.textContent || "";
    })
    .catch(() => "");

  const paragraphs = await page
    .$$eval(
      "#content_tab_description p, #content_tab_description div, #tab-description p, .woocommerce-product-details__short-description p",
      (nodes) =>
        nodes
          .filter((node) => !node.querySelector("li"))
          .map((node) => (node as HTMLElement).textContent || "")
          .map((text) => text.replace(/\s+/g, " ").trim())
          .filter((text) => text.length > 0)
    )
    .catch(() => [] as string[]);

  const rawText = [cleanedContainerText, ...paragraphs].join(" \n\n ");
  const cleaned = rawText
    .replace(/WATCH SPECIFICATIONS:?/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || null;
}

async function extractImages(page: Page): Promise<string[]> {
  const images = await page
    .$$eval(".woocommerce-product-gallery__wrapper img", (imgs) =>
      imgs
        .map((img) =>
          (img.getAttribute("data-src") ||
            img.getAttribute("data-large_image") ||
            img.getAttribute("data-lazy-src") ||
            img.getAttribute("src") ||
            ""
          ).trim()
        )
        .filter(Boolean)
    )
    .catch(() => [] as string[]);

  return Array.from(new Set(images));
}

function findSpecValue(specs: Record<string, string>, keys: string[]): string | null {
  const lowerSpecs = Object.entries(specs).map(([key, value]) => [key.toLowerCase(), value] as const);
  for (const key of keys) {
    const match = lowerSpecs.find(([specKey]) => specKey.includes(key));
    if (match) {
      return match[1];
    }
  }
  return null;
}

async function extractBreadcrumbs(page: Page): Promise<{
  brand: string | null;
  category: string | null;
  fallbackBrand: string | null;
  fallbackCategory: string | null;
  crumbs: string[];
}> {
  const crumbs = await page
    .$$eval(".woocommerce-breadcrumb a, .woocommerce-breadcrumb span", (nodes) =>
      nodes
        .map((node) => (node as HTMLElement).textContent || "")
        .map((text) => text.trim())
        .filter(Boolean)
    )
    .catch(() => [] as string[]);

  const filtered = crumbs.filter((crumb) => crumb.toLowerCase() !== "home");
  const productCrumb = filtered[filtered.length - 1] || null;
  const brandCandidate = filtered.length >= 2 ? filtered[filtered.length - 2] : null;
  const categoryCandidate = filtered.length >= 3 ? filtered[filtered.length - 3] : null;

  return {
    brand: brandCandidate && brandCandidate !== productCrumb ? brandCandidate : null,
    category: categoryCandidate && categoryCandidate !== productCrumb ? categoryCandidate : null,
    fallbackBrand: filtered.length >= 1 ? filtered[0] : null,
    fallbackCategory: filtered.length >= 2 ? filtered[1] : null,
    crumbs: filtered,
  };
}

function pickCategory(candidates: Array<string | null>, brand: string | null): string | null {
  const brandLower = (brand || "").trim().toLowerCase();
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const candidateLower = candidate.trim().toLowerCase();
    if (candidateLower.length === 0) {
      continue;
    }
    if (brandLower && candidateLower === brandLower) {
      continue;
    }
    // Force canonical "Bags" when candidate is anything bag-like
    // (covers: handbag, hand bag, handbags, luxury handbag, bag-like variants)
    if (
      candidateLower === "bags" ||
      candidateLower === "bag" ||
      candidateLower.includes("handbag") ||
      candidateLower.includes("hand bags") ||
      candidateLower.includes("handbags") ||
      candidateLower.includes("luxurybag") ||
      candidateLower.includes("luxury handbag")
    ) {
      return "Bags";
    }

    return candidate.trim();
  }
  return null;
}

function pickCategoryFromCrumbs(crumbs: string[]): string | null {
  const categoryTokens = ["watches", "watch", "bags", "bag", "jewelry", "jewellery"];
  for (const crumb of crumbs) {
    const lower = crumb.trim().toLowerCase();
    if (categoryTokens.includes(lower)) {
      if (lower === "bags" || lower === "bag") {
        return "Bags";
      }
      return crumb.trim();
    }
  }
  return null;
}

async function extractProductMeta(page: Page): Promise<{ brand: string | null; category: string | null }> {
  const category = await page
    .$eval(".product_meta .posted_in a", (el) => (el as HTMLElement).textContent || "")
    .catch(() => "");

  const brand = await page
    .$eval(".product_meta .brand a", (el) => (el as HTMLElement).textContent || "")
    .catch(() => "");

  return {
    brand: brand.trim() || null,
    category: category.trim() || null,
  };
}

function extractBrandFromSlug(productUrl: string): string | null {
  try {
    const slug = new URL(productUrl).pathname.split("/").filter(Boolean)[0] || "";
    if (!slug) {
      return null;
    }
    const firstToken = slug.split("-")[0];
    return firstToken ? capitalize(firstToken) : null;
  } catch {
    return null;
  }
}

function extractBrandFromTitle(title: string): string | null {
  const token = title.trim().split(" ")[0];
  return token ? token.trim() : null;
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatSpecifications(specs: Record<string, string>): string | null {
  const entries = Object.entries(specs);
  if (entries.length === 0) {
    return null;
  }
  return entries.map(([key, value]) => `${key}: ${value}`).join(" | ");
}
