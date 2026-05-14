import { ScrapedProduct } from "../types/product";
import { logger } from "../utils/logger";
import { saveReport } from "./jsonStorage";
import { DbProductSummary, loadDbProductSummaries } from "./dbCompare";
import { collectListingProducts, ListingProduct } from "../scrapers/collectListingProducts";
import { scrapeProductUrls } from "../scrapers/scrapeProductUrls";
import { chromium } from "playwright";
import { insertMissingInDbToStaging, insertMissingFromReferenceToStaging, insertPriceUpdatesToStaging } from "./stagingInsert";

export interface ReferenceSiteCompareOptions {
  headless: boolean;
  debug: boolean;
  concurrency: number;
  limit?: number;
  categories?: string[];
  writeStagingMissing?: boolean;
}

export interface ReferenceSiteCompareResult {
  referenceListings: ListingProduct[];
  dbProducts: DbProductSummary[];
  missingListings: ListingProduct[];
  missingInDb: ScrapedProduct[];
  inBoth: DbProductSummary[];
  onlyInDb: DbProductSummary[];
  priceMismatches: PriceMismatch[];
}

export interface PriceMismatch {
  ref_no: string | null;
  name: string;
  db_price: number;
  reference_price: number;
  product_url: string | null;
  category_name: string | null;
  brand_name?: string | null;
}

export interface PriceComparison {
  ref_no: string | null;
  name: string;
  db_price: number;
  reference_price: number;
  product_url: string | null;
  category_name: string | null;
  price_match: boolean;
  match_source: "ref" | "name";
}

export async function compareDatabaseToReferenceSite(
  options: ReferenceSiteCompareOptions
): Promise<ReferenceSiteCompareResult> {
  const categories = options.categories && options.categories.length > 0
    ? options.categories
    : ["watches", "jewelry", "bags"];

  const referenceListings = await scrapeReferenceSite(categories, options);
  await saveReport("reference-listings.partial.json", referenceListings);
  const dbProducts = await loadDbProductSummaries();
  await saveReport("db-products.partial.json", dbProducts);

  // 1. SMART MATCH: Missing from Reference (Bagong Scrape na wala pa sa DB)
  const missingListings = referenceListings.filter((listing) => {
    return !dbProducts.some(dbProduct => isSameProduct(dbProduct, listing));
  });
  await saveReport("missing-in-db-listings.partial.json", missingListings);

  // 2. SMART MATCH: Orphans (Nasa DB pero wala na sa Reference Site)
  const onlyInDb = dbProducts.filter((dbProduct) => {
    if (!matchesCategoryFilter(dbProduct.category_name, categories)) {
      return false;
    }
    return !referenceListings.some(listing => isSameProduct(dbProduct, listing));
  });

  // 3. SMART MATCH: In Both (Nasa DB at nasa Reference Site)
  const inBoth = dbProducts.filter((dbProduct) => {
    if (!matchesCategoryFilter(dbProduct.category_name, categories)) {
      return false;
    }
    return referenceListings.some(listing => isSameProduct(dbProduct, listing));
  });

  const priceComparisons = buildPriceComparisons(inBoth, referenceListings);
  const priceMismatches = findPriceMismatches(inBoth, referenceListings);

  const missingUrls = missingListings.map((product) => product.product_url).filter((url): url is string => Boolean(url));
  const missingInDb = await scrapeProductUrls(missingUrls, {
    headless: options.headless,
    debug: options.debug,
    concurrency: options.concurrency,
    limit: options.limit,
  });

  if (options.writeStagingMissing) {
    if (missingInDb && missingInDb.length > 0) {
      await insertMissingInDbToStaging(missingInDb);
    }
    
    if (onlyInDb && onlyInDb.length > 0) {
      logger.info(`Sending ${onlyInDb.length} orphan products to Staging for Archive Review...`);
      await insertMissingFromReferenceToStaging(onlyInDb);
    }

    if (priceMismatches && priceMismatches.length > 0) {
      logger.info(`Sending ${priceMismatches.length} price updates to Staging...`);
      await insertPriceUpdatesToStaging(priceMismatches);
    }
  }

  await saveReport("reference-listings.json", referenceListings);
  await saveReport("db-products.json", dbProducts);
  await saveReport("missing-in-db-listings.json", missingListings);
  const normalizeToBagsCategoryFromText = (p: ScrapedProduct): string | null => {
    const rawCategory = (p.raw_category_name ?? "").toLowerCase();
    const name = (p.scraped_name ?? "").toLowerCase();
    const description = (p.description ?? "").toLowerCase();

    const haystack = `${rawCategory} ${name} ${description}`.trim();

    const WATCH_EXCLUSION_KEYWORDS = [
      "watch",
      "timepiece",
      "chronograph",
      "movement",
      "dial",
    ];

    // Disambiguate Chanel watch pages: Chanel might have watch items; exclude watch-like text.
    const isChanel = rawCategory.includes("chanel") || name.includes("chanel");
    const isWatchLike = WATCH_EXCLUSION_KEYWORDS.some((k) => haystack.includes(k));
    if (isChanel && isWatchLike) return p.raw_category_name || "Unknown";

    // Bag-like detection (covers "luxurybag" etc.)
    const bagsLike =
      /(^|\s)(bag|bags|handbag|handbags|luxury\s*handbag|luxurybag|purse|wallet|clutch|tote|satchel)\b/i.test(
        haystack
      ) || /bag/i.test(haystack);

    return bagsLike ? "bags" : (p.raw_category_name ?? "Unknown");
  };

  const normalizedMissingInDb = missingInDb.map((p) => ({
    ...p,
    raw_category_name: normalizeToBagsCategoryFromText(p),
  }));

  await saveReport("missing-in-db.json", normalizedMissingInDb);
  const normalizedInBoth = inBoth.map((p) => ({
    ...p,
    category_name: normalizeCategoryName(p.category_name || "") === "bags" ? "bags" : p.category_name,
  }));
  await saveReport("in-both.json", normalizedInBoth);
  await saveReport("only-in-db.json", onlyInDb);
  await saveReport("price-comparisons.json", priceComparisons);
  await saveReport("price-mismatches.json", priceMismatches);
  await saveReport("reference-compare-summary.json", {
    reference_count: referenceListings.length,
    db_count: dbProducts.length,
    missing_in_db: missingListings.length,
    missing_in_db_scraped: missingInDb.length,
    in_both: inBoth.length,
    only_in_db: onlyInDb.length,
    price_comparisons: priceComparisons.length,
    price_mismatches: priceMismatches.length,
    generated_at: new Date().toISOString(),
  });

  logger.report(
    `Reference comparison complete. Reference: ${referenceListings.length}, DB: ${dbProducts.length}, Missing: ${missingListings.length}, Only in DB: ${onlyInDb.length}`
  );

  return {
    referenceListings,
    dbProducts,
    missingListings,
    missingInDb,
    inBoth,
    onlyInDb,
    priceMismatches,
  };
}

// ==========================================
// 🧠 ANG ATING SMART MATCHER 
// ==========================================
// 🧠 ANG MAS MATALINONG SMART MATCHER 
function isSameProduct(dbProduct: DbProductSummary, listing: ListingProduct): boolean {
  // 1. Exact Ref/SKU Match
  if (dbProduct.normalized_ref_no && listing.normalized_ref_no) {
    if (dbProduct.normalized_ref_no === listing.normalized_ref_no) return true;
  }

  // 2. Smart Name Match (Pang-counter sa "...", putol na words, o baligtad na salita)
  const dbName = normalizeNameKey(dbProduct.name) || "";
  const listName = normalizeNameKey(listing.scraped_name) || "";

  if (dbName && listName) {
    if (dbName === listName) return true;
    
    // Gagamit tayo ng .includes() imbes na .startsWith()
    // Kung ang isang buong pangalan ay nasa loob ng isa pang pangalan, MATCH 'yan!
    if (dbName.length > 12 && listName.length > 12) {
      if (dbName.includes(listName) || listName.includes(dbName)) {
        return true;
      }
    }
  }

  return false;
}

// ==========================================
// MGA HELPER FUNCTIONS MO
// ==========================================

async function scrapeReferenceSite(
  categories: string[],
  options: ReferenceSiteCompareOptions
): Promise<ListingProduct[]> {
  const allProducts: ListingProduct[] = [];
  const browser = await chromium.launch({ headless: options.headless });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  });

  for (const category of categories) {
    logger.info(`Scraping reference listings for category: ${category}`);
    const page = await context.newPage();
    const listings = await collectListingProducts(page, getCategoryUrl(category), {
      debug: options.debug,
      limit: options.limit,
      category,
    });

    await page.close();

    // Backfill: listing-card price selectors can be brittle; if we couldn't get a numeric price,
    // re-scrape price from the product page.
    const missingPriceListings = listings.filter((l) => l.scraped_price === null && Boolean(l.product_url));
    if (missingPriceListings.length > 0) {
      logger.info(`Backfilling ${missingPriceListings.length} product prices from product pages...`);
      const missingUrls = missingPriceListings.map((l) => l.product_url).filter((u): u is string => Boolean(u));

      const scraped = await scrapeProductUrls(missingUrls, {
        headless: options.headless,
        debug: options.debug,
        concurrency: Math.max(1, options.concurrency),
        limit: options.limit,
      });

      const byUrl = new Map(scraped.map((p) => [p.product_url, p]));
      for (const listing of missingPriceListings) {
        const product = byUrl.get(listing.product_url);
        if (!product) continue;

        listing.scraped_price = product.scraped_price;
        listing.currency = product.currency;
      }
    }

    allProducts.push(...listings);
  }

  await browser.close();

  return dedupeProducts(allProducts);
}

function dedupeProducts(products: ListingProduct[]): ListingProduct[] {
  const seenRefs = new Set<string>();
  const seenUrls = new Set<string>();
  const unique: ListingProduct[] = [];

  for (const product of products) {
    if (product.normalized_ref_no && seenRefs.has(product.normalized_ref_no)) continue;
    if (product.product_url && seenUrls.has(product.product_url)) continue;

    if (product.normalized_ref_no) seenRefs.add(product.normalized_ref_no);
    if (product.product_url) seenUrls.add(product.product_url);
    unique.push(product);
  }

  return unique;
}

function getCategoryUrl(category: string): string {
  const normalized = category.toLowerCase();
  if (normalized === "jewelry") return "https://luxurysouq.com/jewellery/";
  return `https://luxurysouq.com/${normalized}/`;
}

function matchesCategoryFilter(categoryName: string | null, categories: string[]): boolean {
  if (!categoryName) return false;
  const normalizedCategory = normalizeCategoryName(categoryName);
  return categories.some((category) => {
    const normalizedFilter = normalizeCategoryName(category);
    if (!normalizedFilter) return false;
    if (normalizedCategory.includes(normalizedFilter)) return true;
    const keywords = getCategoryKeywords(normalizedFilter);
    return keywords.some((keyword) => normalizedCategory.includes(keyword));
  });
}

function getCategoryKeywords(category: string): string[] {
  if (category === "jewelry") return ["jewel", "ring", "bracelet", "necklace", "earring", "pendant", "cufflink", "brooch", "bangle"];
  if (category === "bags") return ["bag", "handbag", "purse", "wallet", "clutch"];
  if (category === "watches") return ["watch"];
  return [];
}

// Collapses category name variants into canonical ids used in reports.
function normalizeCategoryName(value: string): string {
  const lowered = value.toLowerCase().trim();

  // Bags normalization first (covers: bag, bags, handbag, handbags, luxury handbag, luxurybag, etc.)
  const bagsLike = /(^|\s)(bag|bags|handbag|handbags|luxury\s*handbag|luxurybag|purse|wallet|clutch|tote|satchel)\b/i.test(
    lowered
  );
  if (bagsLike) return "bags";

  // Keep existing jewelry normalization behavior.
  return lowered
    .replace(/[^a-z]/g, "")
    .replace("jewellery", "jewelry")
    .trim();
}

function normalizeNameKey(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function getEffectiveDbPrice(product: DbProductSummary): number | null {
  if (typeof product.sale_price === "number") return product.sale_price;
  if (typeof product.price === "number") return product.price;
  return null;
}

// 🧠 IN-UPDATE NA GAMIT ANG SMART MATCHER
function findPriceMismatches(
  dbProducts: DbProductSummary[],
  referenceListings: ListingProduct[]
): PriceMismatch[] {
  const mismatches: PriceMismatch[] = [];

  for (const product of dbProducts) {
    const dbPrice = getEffectiveDbPrice(product);
    if (dbPrice === null) continue;

    const listing = referenceListings.find(l => isSameProduct(product, l));
    if (!listing || listing.scraped_price === null) continue;

    if (Math.abs(dbPrice - listing.scraped_price) > 0.01) {
      mismatches.push({
        ref_no: product.ref_no,
        name: product.name,
        db_price: dbPrice,
        reference_price: listing.scraped_price,
        product_url: listing.product_url || null,
        category_name: product.category_name,
        brand_name: product.brand_name, // 👈 IPAPASA NA NATIN ANG TOTOONG BRAND!
      });
    }
  }

  return mismatches;
}

// 🧠 IN-UPDATE NA GAMIT ANG SMART MATCHER
function buildPriceComparisons(
  dbProducts: DbProductSummary[],
  referenceListings: ListingProduct[]
): PriceComparison[] {
  const results: PriceComparison[] = [];

  for (const product of dbProducts) {
    const dbPrice = getEffectiveDbPrice(product);
    if (dbPrice === null) continue;

    const listing = referenceListings.find(l => isSameProduct(product, l));
    if (!listing || listing.scraped_price === null) continue;

    const priceMatch = Math.abs(dbPrice - listing.scraped_price) <= 0.01;
    
    let matchSource: "ref" | "name" = "name";
    if (product.normalized_ref_no && listing.normalized_ref_no && product.normalized_ref_no === listing.normalized_ref_no) {
      matchSource = "ref";
    }

    results.push({
      ref_no: product.ref_no,
      name: product.name,
      db_price: dbPrice,
      reference_price: listing.scraped_price,
      product_url: listing.product_url || null,
      category_name: product.category_name,
      price_match: priceMatch,
      match_source: matchSource,
    });
  }

  return results;
}
