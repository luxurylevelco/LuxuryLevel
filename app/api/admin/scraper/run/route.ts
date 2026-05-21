import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildBrandIndex, matchBrandFromCandidates } from '@/lib/brand-matcher';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// 🧠 1. HELPER FUNCTIONS & DECODERS
// ==========================================
const normalizeKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '').trim();

function normalizeNameKey(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

// 🔥 POWERFUL DECODER (Naglilinis ng &#8217; at Invisible Spaces)
const decodeHtmlEntities = (value: string | null | undefined): string => {
  if (!value) return '';
  return value
    .replace(/&#8211;|&ndash;/gi, '-')
    .replace(/&#8212;|&mdash;/gi, '-')
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/gi, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&#0*38;|&amp;/gi, '&')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ') 
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenizeName = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter((token) => token.length > 2);
};

const extractRefTokens = (value: string | null | undefined): string[] => {
  if (!value) return [];
  const matches = value.toUpperCase().match(/[A-Z0-9]{6,}/g) || [];
  const filtered = matches.filter((token) => /\d/.test(token));
  return Array.from(new Set(filtered.map((token) => normalizeKey(token))));
};

const isBrandCompatible = (dbBrand: string | null | undefined, scrapedBrandKey: string) => {
  if (!scrapedBrandKey) return true;
  const dbKey = dbBrand ? normalizeKey(dbBrand) : '';
  if (!dbKey) return true;
  return dbKey === scrapedBrandKey || dbKey.includes(scrapedBrandKey) || scrapedBrandKey.includes(dbKey);
};

const isLooseNameMatch = (a: string[], b: string[]) => {
  if (a.length === 0 || b.length === 0) return false;
  const aSet = new Set(a);
  let overlap = 0;
  for (const token of b) {
    if (aSet.has(token)) overlap++;
  }
  const minLen = Math.min(a.length, b.length);
  return overlap >= 2 && overlap / minLen >= 0.6;
};

const getAttributeValue = (attributes: any[] | undefined, targets: string[]): string | null => {
  if (!attributes || attributes.length === 0) return null;
  const lowerTargets = targets.map((target) => target.toLowerCase());
  const match = attributes.find((attr) => {
    const name = (attr?.name || '').toLowerCase();
    const taxonomy = (attr?.taxonomy || '').toLowerCase().replace(/^pa_/, '');
    return lowerTargets.includes(name) || (taxonomy && lowerTargets.includes(taxonomy));
  });
  if (!match) return null;
  const terms = Array.isArray(match.terms) ? match.terms.map((term: any) => term?.name).filter(Boolean) : [];
  if (terms.length > 0) return terms.join(', ');
  const options = Array.isArray(match.options) ? match.options.map((option: any) => `${option}`).filter(Boolean) : [];
  if (options.length > 0) return options.join(', ');
  if (typeof match.value === 'string') return match.value;
  return null;
};

const stripHtml = (value: string): string => {
  const noHtml = value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?[^>]+>/g, ' ');
  return decodeHtmlEntities(noHtml); 
};

// ORPHAN CHECKER
function isSameProductStrict(dbProduct: any, scrapedProduct: any): boolean {
  let scrapedSku = scrapedProduct.sku;
  if (!scrapedSku) {
    scrapedSku = getAttributeValue(scrapedProduct.attributes, ['ref. no', 'ref no', 'reference', 'sku']);
  }

  if (dbProduct.ref_no && scrapedSku) {
    const dbRef = normalizeKey(dbProduct.ref_no);
    const scrapedRef = normalizeKey(scrapedSku);
    if (dbRef && scrapedRef && dbRef === scrapedRef) return true;
  }

  const cleanDbName = decodeHtmlEntities(dbProduct.name);
  const cleanScrapedName = decodeHtmlEntities(scrapedProduct.name);

  const dbName = normalizeNameKey(cleanDbName) || "";
  const listName = normalizeNameKey(cleanScrapedName) || "";
  if (!dbName || !listName) return false;

  return dbName === listName;
}

const jewelryTypeKeywords = ['ring', 'bracelet', 'cufflink', 'bridal', 'necklace', 'earring', 'earrings', 'bangle', 'pendant', 'brooch', 'anklet', 'chain', 'choker'];
const watchTypeKeywords = ['watch', 'watches', 'timepiece', 'timepieces', 'chronograph'];

const isJewelryTypeCategory = (value: string) => {
  const normalized = normalizeKey(value);
  return jewelryTypeKeywords.some((keyword) => normalized.includes(keyword));
};

const isWatchTypeCategory = (value: string) => {
  const normalized = normalizeKey(value);
  return watchTypeKeywords.some((keyword) => normalized.includes(keyword));
};

const normalizeTextValue = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputCategory = (body.category || 'all').toLowerCase();
    const categoryToScrape = inputCategory === 'jewellery' ? 'jewelry' : inputCategory;

    console.log(`🚀 Starting SMART COMPARISON Scraper for: ${categoryToScrape.toUpperCase()}`);

    const { data: brandRows, error: brandError } = await supabaseAdmin.from('brand').select('name');
    if (brandError) throw new Error(`Brand fetch error: ${brandError.message}`);
    const brandIndex = buildBrandIndex((brandRows || []).map((row) => row.name));

    // ==========================================
    // 🗄️ 2. FETCH EXISTING DB PRODUCTS (SAFE PAGINATION)
    // ==========================================
    console.log(`🔍 Fetching existing local database products...`);
    
    let allDbProductsRaw: any[] = [];
    let start = 0;
    let step = 1000;
    let hasMoreDb = true;

    // 🔥 FIX 1: PAGINATION (Para basahin niya yung libo-libong watches mo!)
    while (hasMoreDb) {
      const { data, error } = await supabaseAdmin
        .from('product')
        .select('id, ref_no, name, price, sale_price, category_id, brand_id, description, color, gender')
        .range(start, start + step - 1);

      if (error) throw new Error(`DB Error: ${error.message}`);
      if (data && data.length > 0) {
        allDbProductsRaw.push(...data);
        start += step;
      } else {
        hasMoreDb = false;
      }
    }

    // 🔥 FIX 2: HIWALAY NA QUERY (Para iwas "Could not embed" Relationship Error)
    const { data: rawCategories } = await supabaseAdmin.from('category').select('id, name');
    const { data: rawBrands } = await supabaseAdmin.from('brand').select('id, name');

    const dbProducts = allDbProductsRaw.map(p => ({
      ...p,
      category: { name: rawCategories?.find(c => c.id === p.category_id)?.name || 'Unknown' },
      brand: { name: rawBrands?.find(b => b.id === p.brand_id)?.name || 'Unknown' }
    }));

    // 🔥 FIX 3: DECODE DB NAMES BAGO GAWAN NG TOKENS 🔥
    const dbIndex = dbProducts.map((product) => {
      const decodedDbName = decodeHtmlEntities(product.name);
      return {
        product,
        refKey: product.ref_no ? normalizeKey(product.ref_no) : null,
        nameKey: normalizeNameKey(decodedDbName),
        brandKey: product.brand?.name ? normalizeKey(product.brand.name) : '',
        refTokens: extractRefTokens(`${product.ref_no || ''} ${decodedDbName}`),
        nameTokens: tokenizeName(decodedDbName),
      };
    });

    const refMap = new Map<string, typeof dbIndex[number]>();
    const nameMap = new Map<string, typeof dbIndex[number][]>();
    const refTokenMap = new Map<string, typeof dbIndex[number][]>();

    for (const indexed of dbIndex) {
      if (indexed.refKey && !refMap.has(indexed.refKey)) {
        refMap.set(indexed.refKey, indexed);
      }
      if (indexed.nameKey) {
        const list = nameMap.get(indexed.nameKey) || [];
        list.push(indexed);
        nameMap.set(indexed.nameKey, list);
      }
      for (const token of indexed.refTokens) {
        const list = refTokenMap.get(token) || [];
        list.push(indexed);
        refTokenMap.set(token, list);
      }
    }

    const relevantDbProducts = categoryToScrape === 'all'
      ? dbProducts
      : dbProducts.filter(p => {
          const catName = p.category?.name?.toLowerCase() || '';
          if (categoryToScrape === 'jewelry') return catName.includes('jewel') || jewelryTypeKeywords.some((keyword) => catName.includes(keyword));
          if (categoryToScrape === 'watches') return catName.includes('watch') || catName.includes('timepiece');
          if (categoryToScrape === 'bags') return catName.includes('bag') || catName.includes('handbag') || catName.includes('purse') || catName.includes('clutch');
          return catName.includes(categoryToScrape);
        });

    // ==========================================
    // 🌐 3. FETCH FROM REFERENCE SITE
    // ==========================================
    let categoryIdQuery = '';
    if (categoryToScrape !== 'all') {
      const slug = categoryToScrape === 'jewelry' ? 'jewellery' : categoryToScrape;
      const catRes = await fetch(`https://luxurysouq.com/wp-json/wp/v2/product_cat?slug=${slug}`);
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData && catData.length > 0) categoryIdQuery = `&category=${catData[0].id}`;
      }
    }

    let allScrapedProducts: any[] = [];
    let page = 1;
    let hasMore = true;

    console.log(`🌐 Fetching products from reference site...`);
    while (hasMore) {
      const url = `https://luxurysouq.com/wp-json/wc/store/products?page=${page}&per_page=50${categoryIdQuery}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept': 'application/json' }
      });

      if (!response.ok) break;
      const products = await response.json();
      
      if (!Array.isArray(products) || products.length === 0) {
        hasMore = false;
      } else {
        allScrapedProducts.push(...products);
        page++;
      }
    }

    if (allScrapedProducts.length === 0) {
      return NextResponse.json({ success: true, message: `No products found.`, count: 0 });
    }

    // ==========================================
    // ⚖️ 4. THE COMPARISON & EXTRACTION LOGIC
    // ==========================================
    const stagingPayload: any[] = [];
    let newCount = 0, updateCount = 0, orphanCount = 0;

    for (const scraped of allScrapedProducts) {
      const finalPrice = parseFloat(scraped.prices?.price || '0');

      let catName = categoryToScrape === 'all' ? 'Unknown' : categoryToScrape;
      
      const categoryNames = scraped.categories?.map((c: any) => decodeHtmlEntities(c.name || '')).join(' ') || '';
      const attributeNames = scraped.attributes?.map((a: any) => {
            const name = decodeHtmlEntities(a.name || '');
            const terms = (a.terms || []).map((t: any) => decodeHtmlEntities(t.name || '')).join(' ');
            return `${name} ${terms}`.trim();
          }).join(' ') || '';

      const decodedName = decodeHtmlEntities(scraped.name || '');
      const searchSpace = `${decodedName} ${categoryNames} ${attributeNames}`.toLowerCase();
      
      if (searchSpace.includes('ring')) catName = 'RING';
      else if (searchSpace.includes('bracelet')) catName = 'BRACELET';
      else if (searchSpace.includes('cufflink')) catName = 'CUFFLINK';
      else if (searchSpace.includes('bridal') || searchSpace.includes('necklace')) catName = 'BRIDAL';
      else if (searchSpace.includes('earring') || searchSpace.includes('earrings')) catName = 'EARRINGS';
      else if (searchSpace.includes('watch') || searchSpace.includes('timepiece')) catName = 'watches';
      else if (searchSpace.includes('bag') || searchSpace.includes('tote') || searchSpace.includes('clutch') || searchSpace.includes('handbag')) catName = 'bags';

      const rawDescription = scraped.short_description || scraped.description || null;
      const description = rawDescription ? normalizeTextValue(stripHtml(rawDescription)) : null;
      const color = normalizeTextValue(getAttributeValue(scraped.attributes, ['color', 'colour']));
      let gender = normalizeTextValue(getAttributeValue(scraped.attributes, ['gender', 'sex']));
      if (!gender) {
        const categoryLabels = scraped.categories?.map((c: any) => `${c?.name || ''}`.toLowerCase()) || [];
        const hasMen = categoryLabels.some((label) => label.includes('men'));
        const hasWomen = categoryLabels.some((label) => label.includes('women') || label.includes('ladies'));
        gender = (hasMen && hasWomen) ? 'Unisex' : (hasMen ? 'Male' : (hasWomen ? 'Female' : null));
      }

      let brandName = 'Unbranded';
      const attrBrandRaw = scraped.attributes?.find((a: any) => a.name.toLowerCase() === 'brand')?.terms?.[0]?.name;
      const attrBrand = attrBrandRaw ? decodeHtmlEntities(attrBrandRaw) : null;
      
      if (attrBrand) {
        brandName = attrBrand;
      } else {
        const genericCats = new Set(['bags', 'watches', 'jewelry', 'jewellery', 'accessories', 'men', 'women', 'mens', 'womens', 'ladies', 'uncategorized']);
        const normalizedCatName = normalizeKey(catName);
        const isJewelryProduct = normalizedCatName === 'jewelry' || normalizedCatName === 'jewellery' || jewelryTypeKeywords.includes(normalizedCatName);

        const brandCategory = scraped.categories?.find((c: any) => {
          const name = decodeHtmlEntities(c?.name || '');
          const normalized = normalizeKey(name);
          if (!normalized || genericCats.has(normalized) || normalized.includes('paylater') || (normalizedCatName && normalized === normalizedCatName)) return false;
          if (isJewelryProduct && isJewelryTypeCategory(name)) return false;
          if (isWatchTypeCategory(name)) return false;
          return true;
        });
        brandName = brandCategory ? decodeHtmlEntities(brandCategory.name || '') : scraped.name.split(' ')[0];
      }

      const matchedBrand = matchBrandFromCandidates(brandIndex, [attrBrand, brandName, decodedName, categoryNames, attributeNames]);
      if (matchedBrand) brandName = matchedBrand;
      if (normalizeKey(brandName).includes('paylater')) brandName = matchedBrand || 'Unbranded';

      let scrapedSku = scraped.sku;
      if (!scrapedSku) {
        scrapedSku = getAttributeValue(scraped.attributes, ['ref. no', 'ref no', 'reference', 'sku']);
      }
      
      const scrapedBrandKey = normalizeKey(brandName);
      const scrapedRefKey = scrapedSku ? normalizeKey(scrapedSku) : null;
      const scrapedNameKey = normalizeNameKey(decodedName);
      const scrapedRefTokens = extractRefTokens(`${scrapedSku || ''} ${decodedName}`);
      const scrapedNameTokens = tokenizeName(decodedName);

      let matchingDb: typeof dbIndex[number] | null = null;
      let matchConfidence: 'ref' | 'ref_token' | 'name_exact' | 'name_loose' | null = null;

      if (scrapedRefKey && refMap.has(scrapedRefKey)) {
        matchingDb = refMap.get(scrapedRefKey) || null;
        matchConfidence = matchingDb ? 'ref' : null;
      }

      if (!matchingDb) {
        for (const token of scrapedRefTokens) {
          const candidates = refTokenMap.get(token);
          if (!candidates || candidates.length === 0) continue;
          const preferred = candidates.find((candidate) => isBrandCompatible(candidate.product.brand?.name, scrapedBrandKey));
          matchingDb = preferred || candidates[0];
          matchConfidence = matchingDb ? 'ref_token' : null;
          if (matchingDb) break;
        }
      }

      if (!matchingDb && scrapedNameKey) {
        const candidates = nameMap.get(scrapedNameKey) || [];
        if (candidates.length > 0) {
          const preferred = candidates.find((candidate) => isBrandCompatible(candidate.product.brand?.name, scrapedBrandKey));
          matchingDb = preferred || candidates[0];
          matchConfidence = matchingDb ? 'name_exact' : null;
        }
      }

      if (!matchingDb) {
        const brandCandidates = scrapedBrandKey ? dbIndex.filter((candidate) => isBrandCompatible(candidate.product.brand?.name, scrapedBrandKey)) : dbIndex;
        const loose = brandCandidates.find((candidate) => isLooseNameMatch(scrapedNameTokens, candidate.nameTokens));
        if (loose) {
          matchingDb = loose;
          matchConfidence = 'name_loose';
        }
      }

      // 🔥 FIX 4: STRICT WATCH CHECKER 🔥
      // Kapag sinabing match pero relo 'to, tapos MAY SKU yung DB mo at Scraped item pero MAGKAIBA Sila = CANCEL MATCH! (Para iwas overwrite)
      if (matchingDb && catName === 'watches') {
        const dbRefKey = matchingDb.product.ref_no ? normalizeKey(matchingDb.product.ref_no) : null;
        if (dbRefKey && scrapedRefKey && dbRefKey !== scrapedRefKey) {
          matchingDb = null;
        }
      }

      const baseStagingData = {
        scraped_ref_no: scrapedSku || `ORPHAN-${scraped.id}`, 
        scraped_name: decodedName,
        scraped_price: finalPrice,
        raw_brand_name: brandName,    
        raw_category_name: catName,   
        image_url: scraped.images?.[0]?.src || null,
        image_url_2: scraped.images?.[1]?.src || null,
        image_url_3: scraped.images?.[2]?.src || null,
        description,
        color,
        gender,
      };

      if (!matchingDb) {
        stagingPayload.push({ ...baseStagingData, sync_status: 'pending' });
        newCount++;
      } else {
        const dbProduct = matchingDb.product;
        const dbPrice = dbProduct.sale_price !== null ? dbProduct.sale_price : dbProduct.price;
        if (Math.abs(dbPrice - finalPrice) > 0.01) {
          stagingPayload.push({
            ...baseStagingData,
            scraped_ref_no: dbProduct.ref_no || baseStagingData.scraped_ref_no,
            sync_status: 'pending',
            error_message: matchConfidence === 'name_loose' ? 'Possible match (name similarity)' : null
          });
          updateCount++;
        }
      }
    }

    // B. Check for Orphans
    for (const dbProduct of relevantDbProducts) {
      const isStillInReference = allScrapedProducts.some(scraped => isSameProductStrict(dbProduct, scraped));
      
      if (!isStillInReference) {
        stagingPayload.push({
          scraped_ref_no: dbProduct.ref_no || `DB-ORPHAN-${dbProduct.id}`,
          scraped_name: decodeHtmlEntities(dbProduct.name),
          scraped_price: null, 
          raw_brand_name: dbProduct.brand?.name || 'Unknown',
          raw_category_name: dbProduct.category?.name || 'Unknown',
          sync_status: 'missing',
          description: normalizeTextValue(dbProduct.description),
          color: normalizeTextValue(dbProduct.color),
          gender: normalizeTextValue(dbProduct.gender),
        });
        orphanCount++;
      }
    }

    // ==========================================
    // 💾 5. SAVE TO STAGING TABLE
    // ==========================================
    if (stagingPayload.length > 0) {
      const uniquePayloadMap = new Map();
      for (const item of stagingPayload) {
        uniquePayloadMap.set(item.scraped_ref_no, item);
      }
      const uniquePayload = Array.from(uniquePayloadMap.values());

      const { error: insertError } = await supabaseAdmin
        .from('staging_products')
        .upsert(uniquePayload, { 
          onConflict: 'scraped_ref_no', 
          ignoreDuplicates: false 
        });

      if (insertError) throw new Error(`Database Error: ${insertError.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Scraped ${categoryToScrape.toUpperCase()}: ${newCount} New, ${updateCount} Updates, ${orphanCount} Missing!`,
      count: stagingPayload.length
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Scraper Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}