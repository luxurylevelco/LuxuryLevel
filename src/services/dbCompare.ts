import path from "path";
import { supabase } from "../../lib/supabase";
import { normalizeRef } from "../utils/normalize";
import { getReportsDir, saveReport } from "./jsonStorage";
import { fileExists, readJson } from "../utils/file";
import { ScrapedProduct } from "../types/product";
import { logger } from "../utils/logger";
// 🚀 IMPORT AN BAGONG FUNCTION MULA SA STAGING INSERT
import { insertMissingFromReferenceToStaging } from "./stagingInsert"; 

export interface DbProductSummary {
  ref_no: string | null;
  normalized_ref_no: string | null;
  name: string;
  category_name: string | null;
  product_url: string | null;
  price: number | null;
  sale_price: number | null;
  brand_name?: string | null; // Added just in case
}

export interface DbCompareResult {
  dbProducts: DbProductSummary[];
  missingFromDb: ScrapedProduct[];
  onlyInDb: DbProductSummary[]; // 🚀 IDINAGDAG: Mga products na nasa DB pero nawawala sa reference
}

export async function compareDatabaseToReference(
  referenceFile?: string
): Promise<DbCompareResult> {
  const referenceProducts = await loadReferenceProducts(referenceFile);
  if (!referenceProducts) {
    return { dbProducts: [], missingFromDb: [], onlyInDb: [] };
  }

  const dbProducts = await loadDbProductSummaries();
  
  // Set ng mga references sa DB natin
  const dbRefSet = new Set(
    dbProducts
      .map((product) => product.normalized_ref_no)
      .filter((ref): ref is string => Boolean(ref))
  );

  // Set ng mga references galing sa Scraped Site
  const referenceSet = new Set(
    referenceProducts
      .map((product) => product.normalized_ref_no)
      .filter((ref): ref is string => Boolean(ref))
  );

  // 1. Missing from DB (Mga bago na kailangang i-add)
  const missingFromDb = referenceProducts.filter((product) => {
    if (!product.normalized_ref_no) return false;
    return !dbRefSet.has(product.normalized_ref_no);
  });

  // 2. 🚀 ONLY IN DB (Mga "Orphans" na nawawala na sa reference site)
  const onlyInDb = dbProducts.filter((product) => {
    if (!product.normalized_ref_no) return false;
    return !referenceSet.has(product.normalized_ref_no);
  });

  await saveReport("db-products.json", dbProducts);
  await saveReport("missing-in-db.json", missingFromDb);
  await saveReport("only-in-db.json", onlyInDb); // 🚀 I-save ang listahan ng orphans

  logger.report(
    `DB comparison complete. DB: ${dbProducts.length}, Missing from DB: ${missingFromDb.length}, Orphans (To Archive): ${onlyInDb.length}`
  );

  // 3. 🚀 IPASOK SA STAGING ANG MGA ORPHANS PARA MA-REVIEW SA DASHBOARD
  if (onlyInDb.length > 0) {
    logger.info(`Sending ${onlyInDb.length} orphan products to Staging for Archive Review...`);
    await insertMissingFromReferenceToStaging(onlyInDb);
  }

  return { dbProducts, missingFromDb, onlyInDb };
}

async function loadReferenceProducts(referenceFile?: string): Promise<ScrapedProduct[] | null> {
  const reportsDir = getReportsDir();
  const referencePath = referenceFile
    ? path.resolve(referenceFile)
    : path.join(reportsDir, "reference-products.json");
  const fallbackPath = path.join(reportsDir, "all-products.json");

  const exists = await fileExists(referencePath);
  if (!exists) {
    logger.warn(`Reference file not found: ${referencePath}`);
    const fallbackExists = await fileExists(fallbackPath);
    if (!fallbackExists) {
      logger.warn("Provide --reference or add reference-products.json.");
      return null;
    }
    logger.warn(`Falling back to ${fallbackPath}`);
    return readJson<ScrapedProduct[]>(fallbackPath).catch(() => null);
  }

  const data = await readJson<ScrapedProduct[]>(referencePath).catch(() => null);
  if (!data) {
    logger.warn("Reference file could not be loaded.");
  }
  return data;
}

export async function loadDbProductSummaries(): Promise<DbProductSummary[]> {
  const categories = await loadCategoryMap();
  const brands = await loadBrandMap(); // 🚀 Kukunin na natin ang brands!

  const { data, error } = await supabase
    .from("product")
    .select("ref_no,name,category_id,brand_id,price,sale_price") // 🚀 Idinagdag ang brand_id
    .order("id", { ascending: true });

  if (error) {
    logger.error(`Failed to load products from DB: ${error.message}`);
    return [];
  }

  return (data || []).map((row) => {
    const refNo = typeof row.ref_no === "string" ? row.ref_no : null;
    const normalized = refNo ? normalizeRef(refNo) : null;
    
    const categoryId = typeof row.category_id === "number" ? row.category_id : null;
    const category = categoryId ? categories.get(categoryId) || null : null;

    // 🚀 Idinagdag ang logic para i-map ang brand_id sa totoong brand name
    const brandId = typeof row.brand_id === "number" ? row.brand_id : null;
    const brand = brandId ? brands.get(brandId) || null : null;

    return {
      ref_no: refNo,
      normalized_ref_no: normalized,
      name: row.name,
      category_name: category,
      brand_name: brand, // 🚀 Ipapasa na natin yung totoong brand name!
      product_url: null,
      price: typeof row.price === "number" ? row.price : null,
      sale_price: typeof row.sale_price === "number" ? row.sale_price : null,
    };
  });
}

async function loadCategoryMap(): Promise<Map<number, string>> {
  const { data, error } = await supabase
    .from("category")
    .select("id,name")
    .order("id", { ascending: true });

  if (error) {
    logger.error(`Failed to load categories from DB: ${error.message}`);
    return new Map();
  }

  const map = new Map<number, string>();
  (data || []).forEach((row) => {
    if (typeof row.id === "number" && typeof row.name === "string") {
      map.set(row.id, row.name);
    }
  });

  return map;
}

// 🚀 BAGONG FUNCTION PARA KUNIN ANG MGA BRANDS SA DATABASE
async function loadBrandMap(): Promise<Map<number, string>> {
  const { data, error } = await supabase
    .from("brand")
    .select("id,name");

  if (error) {
    logger.error(`Failed to load brands from DB: ${error.message}`);
    return new Map();
  }

  const map = new Map<number, string>();
  (data || []).forEach((row) => {
    if (typeof row.id === "number" && typeof row.name === "string") {
      map.set(row.id, row.name);
    }
  });
  return map;
}