import { supabase } from "../../lib/supabase";
import { ScrapedProduct } from "../types/product";
import { extractRefFromSlug, extractRefFromText, normalizeRef } from "../utils/normalize";
import { logger } from "../utils/logger";
import { BrandIndexEntry, buildBrandIndex, matchBrandFromCandidates } from "../../lib/brand-matcher";


interface StagingRow {
  scraped_ref_no: string;
  scraped_name: string;
  scraped_price: number | null;
  raw_brand_name: string;
  raw_category_name: string;
  sync_status: string;
  scraped_at: string | null;
  error_message: string | null;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  description: string | null;
  color: string | null;
  gender: string | null;
}

let brandIndexPromise: Promise<BrandIndexEntry[]> | null = null;

async function getBrandIndex(): Promise<BrandIndexEntry[]> {
  if (!brandIndexPromise) {
    brandIndexPromise = (async () => {
      const { data, error } = await supabase
        .from("brand")
        .select("name");

      if (error) {
        throw new Error(`Brand fetch failed: ${error.message}`);
      }

      const names = (data || [])
        .map((row) => row.name)
        .filter((name): name is string => Boolean(name));

      return buildBrandIndex(names);
    })();
  }

  return brandIndexPromise;
}

export async function insertMissingInDbToStaging(products: ScrapedProduct[]): Promise<void> {
  if (products.length === 0) {
    logger.info("No missing products to insert into staging.");
    return;
  }

  const brandIndex = await getBrandIndex();
  const rows = await buildStagingRows(products, brandIndex);

  if (rows.length === 0) {
    logger.warn("No valid staging rows to insert.");
    return;
  }

  const { error } = await supabase
    .from("staging_products")
    .upsert(rows, { onConflict: "scraped_ref_no" });

  if (error) {
    throw new Error(`Staging insert failed: ${error.message}`);
  }

  logger.info(`Inserted ${rows.length} missing products into staging.`);
}

export async function insertScrapedProductsToStaging(products: ScrapedProduct[]): Promise<void> {
  if (products.length === 0) {
    logger.info("No scraped products to insert into staging.");
    return;
  }

  const brandIndex = await getBrandIndex();
  const rows = await buildStagingRows(products, brandIndex);
  if (rows.length === 0) {
    logger.warn("No valid staging rows to insert.");
    return;
  }

  const { error } = await supabase
    .from("staging_products")
    .upsert(rows, { onConflict: "scraped_ref_no" });

  if (error) {
    throw new Error(`Staging insert failed: ${error.message}`);
  }

  logger.info(`Inserted ${rows.length} scraped products into staging.`);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#0*38;|&amp;/gi, "&")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ");
}

function normalizeField(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const decoded = decodeHtmlEntities(value);
  const normalized = decoded.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function buildStagingRef(product: ScrapedProduct): string | null {
  const isBag = (product.raw_category_name || "").toLowerCase().includes("bag");
  const rawRef = product.scraped_ref_no || product.normalized_ref_no || "";
  const refFromName = product.scraped_name ? extractRefFromText(product.scraped_name) : null;
  const refFromUrl = product.product_url ? extractRefFromSlug(new URL(product.product_url).pathname) : null;
  const fallbackFromName = product.scraped_name ? normalizeRef(product.scraped_name) : null;

  const candidate = isBag
    ? normalizeRef(refFromUrl || "") ||
      normalizeRef(rawRef) ||
      (refFromName ? normalizeRef(refFromName) : null) ||
      fallbackFromName
    : normalizeRef(rawRef) ||
      (refFromName ? normalizeRef(refFromName) : null) ||
      (refFromUrl ? normalizeRef(refFromUrl) : null) ||
      fallbackFromName;

  return candidate && candidate.length > 0 ? candidate : null;
}

// Regex helpers for bag normalization (uniform "bags" category in staging)
const BAG_KEYWORDS = [
  "bag",
  "handbag",
  "purse",
  "wallet",
  "clutch",
  "sling bag",
  "tote",
  "satchel",
];
const WATCH_EXCLUSION_KEYWORDS = [
  "watch",
  "timepiece",
  "chronograph",
  "movement",
  "strap",
  "dial",
];

function normalizeToBagsCategory(input: {
  rawCategoryName: string | null;
  scrapedName: string;
  description: string | null;
  rawBrandName: string | null;
}): string {
  const rawCategory = (input.rawCategoryName || "").toLowerCase();
  const name = (input.scrapedName || "").toLowerCase();
  const description = (input.description || "").toLowerCase();
  const brand = (input.rawBrandName || "").toLowerCase();

  const haystack = `${rawCategory} ${name} ${description}`.trim();

  // 💍 1. BRIDAL CATCH-ALL (Uunahin natin ito bago ang Ring!)
  // Gagamit tayo ng Regex para eksaktong words lang.
  if (/(^|\s)(bridal|necklace|necklaces|earring|earrings|pendant|pendants)\b/i.test(haystack)) {
    return "BRIDAL";
  }

  // 🚀 2. SPECIFIC JEWELRY SUBCATEGORIES
  // \b ibig sabihin "word boundary". Hindi niya papansinin ang "earring" o "spring".
  if (/(^|\s)ring(s)?\b/i.test(haystack)) return "RING";
  if (/(^|\s)bracelet(s)?\b/i.test(haystack)) return "BRACELET";
  if (/(^|\s)cufflink(s)?\b/i.test(haystack)) return "CUFFLINK";

  // ⌚ 3. WATCHES DETECTION
  const isWatchLike = WATCH_EXCLUSION_KEYWORDS.some((k) => haystack.includes(k));
  const isChanel = brand.includes("chanel") || rawCategory.includes("chanel") || name.includes("chanel");

  if (isChanel && isWatchLike) {
    return normalizeField(input.rawCategoryName) || "Unknown";
  }

  // 👜 4. BAGS DETECTION
  const hasBagKeyword =
    BAG_KEYWORDS.some((k) => {
      if (k === "bag") return /\bbag\b/.test(haystack) || haystack.includes("luxurybag");
      return haystack.includes(k);
    }) || /bag/i.test(haystack);

  if (hasBagKeyword) {
    if (isWatchLike && (isChanel || haystack.includes("chanel"))) {
      return normalizeField(input.rawCategoryName) || "Unknown";
    }
    return "bags";
  }

  // 5. DEFAULT FALLBACK
  return normalizeField(input.rawCategoryName) || "Unknown";
}

async function buildStagingRows(
  products: ScrapedProduct[],
  brandIndex: BrandIndexEntry[]
): Promise<StagingRow[]> {
  const rows: StagingRow[] = [];
  const seenRefs = new Set<string>();
  for (const product of products) {
    const ref = buildStagingRef(product);
    if (!ref) {
      logger.warn(`Skipping staging insert without ref: ${product.product_url}`);
      continue;
    }

    if (seenRefs.has(ref)) {
      continue;
    }
    seenRefs.add(ref);

    const name = normalizeField(product.scraped_name) || ref;
    const matchedBrand = matchBrandFromCandidates(brandIndex, [
      product.raw_brand_name,
      product.scraped_name,
    ]);
    const brand = matchedBrand || normalizeField(product.raw_brand_name) || "Unknown";
    const rawCategory = normalizeField(product.raw_category_name);

    const category = normalizeToBagsCategory({
      rawCategoryName: rawCategory,
      scrapedName: name,
      description: product.description,
      rawBrandName: brand,
    });

    rows.push({
      scraped_ref_no: ref,
      scraped_name: name,
      scraped_price: product.scraped_price,
      raw_brand_name: brand,
      raw_category_name: category,
      sync_status: "pending",
      scraped_at: product.scraped_at || null,
      error_message: product.error_message || null,
      image_url: product.image_url,
      image_url_2: product.image_url_2,
      image_url_3: product.image_url_3,
      description: product.description,
      color: product.color,
      gender: product.gender,
    });
  }

  return rows;
}
// BAGONG FUNCTION PARA SA MGA I-A-ARCHIVE NA PRODUCTS
export async function insertMissingFromReferenceToStaging(localOrphans: any[]): Promise<void> {
  if (localOrphans.length === 0) {
    logger.info("No missing (orphan) products to insert into staging.");
    return;
  }

  // 🚀 THE FIX: Gagamit tayo ng Map para walang duplicates na magpapa-crash sa Supabase
  const uniqueRowsMap = new Map();

  localOrphans.forEach((product) => {
    const brand: string | null = product.brand?.name || product.brand_name || "Unknown";
    const rawCategory: string | null = product.category?.name || product.category_name || "Unknown";
    const scrapedName: string = product.name || "";

    const normalizedCategory = normalizeToBagsCategory({
      rawCategoryName: rawCategory,
      scrapedName,
      description: null,
      rawBrandName: brand,
    });

    // 🛡️ SAFE FALLBACK: Kung walang ref_no ang jewelry, gagawa tayo ng unique ID gamit ang pangalan niya
    const safeRefNo = product.ref_no 
      || product.normalized_ref_no 
      || `ORPHAN-${scrapedName.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '')}`;

    // 📦 Ilalagay sa Map. Kung may kaparehas siyang safeRefNo, o-overwrite lang niya para isa lang ang papasa
    uniqueRowsMap.set(safeRefNo, {
      scraped_ref_no: safeRefNo,
      scraped_name: scrapedName,
      scraped_price: null, // 🚨 IMPORTANTE: Gawing null para pumasok sa "To Archive" tab
      raw_brand_name: brand,
      raw_category_name: normalizedCategory,
      sync_status: "missing", // 🚨 IMPORTANTE: Set status to 'missing'
      scraped_at: new Date().toISOString(),
      error_message: null,
      image_url: null,
      image_url_2: null,
      image_url_3: null,
      description: null,
      color: null,
      gender: null,
    });
  });

  // 🧹 I-convert pabalik sa array yung mga malilinis at unique na rows
  const uniqueRows = Array.from(uniqueRowsMap.values());

  const { error } = await supabase
    .from("staging_products")
    .upsert(uniqueRows, { onConflict: "scraped_ref_no" });

  if (error) {
    throw new Error(`Orphan staging insert failed: ${error.message}`);
  }

  logger.info(`Inserted ${uniqueRows.length} unique missing products (for archiving) into staging.`);
}

// 🚀 BAGONG FUNCTION PARA SA PRICE UPDATES
// 🚀 PALITAN ANG BUONG FUNCTION NA ITO SA stagingInsert.ts
export async function insertPriceUpdatesToStaging(mismatches: any[]): Promise<void> {
  if (mismatches.length === 0) return;

  const rows: StagingRow[] = mismatches.map((mismatch) => {
    const scrapedName: string = mismatch.name || "";
    const rawCategory: string | null = mismatch.category_name || "Unknown";
    
    // 🎯 THE FIX: Kukunin na natin ang totoong brand mula sa DB!
    const brand: string | null = mismatch.brand_name || "Unknown";

    const normalizedCategory = normalizeToBagsCategory({
      rawCategoryName: rawCategory,
      scrapedName,
      description: null,
      rawBrandName: brand,
    });

    return {
      scraped_ref_no: mismatch.ref_no,
      scraped_name: scrapedName,
      scraped_price: mismatch.reference_price, 
      raw_brand_name: brand, // 👈 Hindi na ito magiging "Unknown"!
      raw_category_name: normalizedCategory,
      sync_status: "pending", 
      scraped_at: new Date().toISOString(),
      error_message: null,
      image_url: null,
      image_url_2: null,
      image_url_3: null,
      description: null,
      color: null,
      gender: null,
    };
  });

  const { error } = await supabase
    .from("staging_products")
    .upsert(rows, { onConflict: "scraped_ref_no" });

  if (error) {
    throw new Error(`Price mismatch staging insert failed: ${error.message}`);
  }

  logger.info(`Inserted ${rows.length} price updates into staging.`);
}