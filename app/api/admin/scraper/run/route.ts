import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  return name
    .normalize("NFD") 
    .replace(/[\u0300-\u036f]/g, "") 
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

const decodeHtmlEntities = (value: string | null | undefined): string => {
  if (!value) return '';
  return value
    .replace(/&#8211;|&ndash;/gi, '-')
    .replace(/&#8212;|&mdash;/gi, '-')
    .replace(/&#8216;|&#8217;|&lsquo;|&rsquo;/gi, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&#038;|&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ') 
    .replace(/\s+/g, ' ')
    .trim();
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

// ==========================================
// 🧠 2. ANG SMART MATCHER MO (STRICT SKU FOR WATCHES)
// ==========================================
function isSameProduct(dbProduct: any, scrapedProduct: any): boolean {
  let scrapedSku = scrapedProduct.sku;
  if (!scrapedSku) {
    scrapedSku = getAttributeValue(scrapedProduct.attributes, ['ref. no', 'ref no', 'reference', 'sku']);
  }

  const dbRef = dbProduct.ref_no ? normalizeKey(dbProduct.ref_no) : null;
  const scrapedRef = scrapedSku ? normalizeKey(scrapedSku) : null;

  // Alamin kung relo ba ang pino-process natin base sa Database Category
  const dbCat = (dbProduct.category?.name || '').toLowerCase();
  const isWatchCategory = dbCat.includes('watch') || dbCat.includes('timepiece');

  // 🔥 1. EXACT SKU / REF CHECK 🔥
  if (dbRef && scrapedRef) {
    if (dbRef === scrapedRef) return true;
    
    // 👉 STRICT WATCH RULE: Kung relo ito at parehong may SKU pero magkaiba, FAIL AGAD!
    // Ii-skip na natin ang name check para hindi mapagkamalang pareho.
    if (isWatchCategory) return false;
  }

  // 2. NAME MATCHING FALLBACK (Kapag walang SKU yung isa, o kung hindi relo)
  const cleanDbName = decodeHtmlEntities(dbProduct.name);
  const cleanScrapedName = decodeHtmlEntities(scrapedProduct.name);

  const dbNameStr = normalizeNameKey(cleanDbName) || "";
  const listNameStr = normalizeNameKey(cleanScrapedName) || "";

  // CROSS-REFERENCE CHECK: Hinahanap yung SKU sa loob ng Title
  if (dbRef && dbRef.length > 4 && listNameStr.includes(dbRef)) return true;
  if (scrapedRef && scrapedRef.length > 4 && dbNameStr.includes(scrapedRef)) return true;

  if (dbNameStr && listNameStr) {
    if (dbNameStr === listNameStr) return true;
    
    if (dbNameStr.includes(listNameStr) || listNameStr.includes(dbNameStr)) {
      if (dbNameStr.length < 15 || listNameStr.length < 15) {
        const lenDiff = Math.abs(dbNameStr.length - listNameStr.length);
        if (lenDiff <= 5) return true;
        return false;
      }
      return true; 
    }
  }

  return false;
}

const jewelryTypeKeywords = [
  'ring', 'bracelet', 'cufflink', 'bridal', 'necklace', 
  'earring', 'earrings', 'bangle', 'pendant', 'brooch', 
  'anklet', 'chain', 'choker',
];

const watchTypeKeywords = [
  'watch', 'watches', 'timepiece', 'timepieces', 'chronograph',
];

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

    // ==========================================
    // 🗄️ 3. FETCH EXISTING DB PRODUCTS
    // ==========================================
    console.log(`🔍 Fetching existing local database products...`);
    
    let allDbProductsRaw: any[] = [];
    let start = 0;
    let step = 1000;
    let hasMoreDb = true;

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

    const { data: rawCategories } = await supabaseAdmin.from('category').select('id, name');
    const { data: rawBrands } = await supabaseAdmin.from('brand').select('id, name');

    const dbProducts = allDbProductsRaw.map(p => ({
      ...p,
      category: {
        name: rawCategories?.find(c => c.id === p.category_id)?.name || 'Unknown'
      },
      brand: {
        name: rawBrands?.find(b => b.id === p.brand_id)?.name || 'Unknown'
      }
    }));

    const relevantDbProducts = categoryToScrape === 'all'
      ? dbProducts
      : dbProducts.filter(p => {
          const catName = p.category?.name?.toLowerCase() || '';
          if (categoryToScrape === 'jewelry') {
            return catName.includes('jewel') || jewelryTypeKeywords.some((keyword) => catName.includes(keyword));
          }
          if (categoryToScrape === 'watches') {
            return catName.includes('watch') || catName.includes('timepiece');
          }
          if (categoryToScrape === 'bags') {
            return catName.includes('bag') || catName.includes('handbag') || catName.includes('purse') || catName.includes('clutch');
          }
          return catName.includes(categoryToScrape);
        });

    // ==========================================
    // 🌐 4. FETCH FROM REFERENCE SITE
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
    // ⚖️ 5. THE COMPARISON & EXTRACTION LOGIC
    // ==========================================
    const stagingPayload: any[] = [];
    let newCount = 0, updateCount = 0, orphanCount = 0;

    for (const scraped of allScrapedProducts) {
      
      scraped.name = decodeHtmlEntities(scraped.name);
      
      const matchingDb = relevantDbProducts.find(dbP => isSameProduct(dbP, scraped));
      const finalPrice = parseFloat(scraped.prices?.price || '0');

      let catName = categoryToScrape === 'all' ? 'Unknown' : categoryToScrape;
      
      const categoryNames = scraped.categories?.map((c: any) => c.name).join(' ') || '';
      const attributeNames =
        scraped.attributes
          ?.map((a: any) => `${a.name} ${(a.terms || []).map((t: any) => t.name).join(' ')}`)
          .join(' ') || '';
          
      const searchSpace = `${scraped.name} ${categoryNames} ${attributeNames}`.toLowerCase();

      if (searchSpace.includes('watch') || searchSpace.includes('timepiece') || searchSpace.includes('chronograph')) catName = 'watches';
      else if (searchSpace.includes('bag') || searchSpace.includes('tote') || searchSpace.includes('clutch') || searchSpace.includes('handbag') || searchSpace.includes('purse')) catName = 'bags';
      else if (searchSpace.includes('ring')) catName = 'RING';
      else if (searchSpace.includes('bracelet')) catName = 'BRACELET';
      else if (searchSpace.includes('cufflink')) catName = 'CUFFLINK';
      else if (searchSpace.includes('bridal') || searchSpace.includes('necklace')) catName = 'BRIDAL';
      else if (searchSpace.includes('earring') || searchSpace.includes('earrings')) catName = 'EARRINGS';

      const rawDescription = scraped.short_description || scraped.description || null;
      const description = rawDescription ? normalizeTextValue(stripHtml(rawDescription)) : null;
      const color = normalizeTextValue(getAttributeValue(scraped.attributes, ['color', 'colour']));
      let gender = normalizeTextValue(getAttributeValue(scraped.attributes, ['gender', 'sex']));
      if (!gender) {
        const categoryLabels = scraped.categories?.map((c: any) => `${c?.name || ''}`.toLowerCase()) || [];
        const hasMen = categoryLabels.some((label) => label.includes('men'));
        const hasWomen = categoryLabels.some((label) => label.includes('women') || label.includes('ladies'));
        if (hasMen && hasWomen) {
          gender = 'Unisex';
        } else if (hasMen) {
          gender = 'Male';
        } else if (hasWomen) {
          gender = 'Female';
        }
      }

      let brandName = 'Unbranded';
      const attrBrand = scraped.attributes?.find((a: any) => a.name.toLowerCase() === 'brand')?.terms?.[0]?.name;
      
      if (attrBrand) {
        brandName = decodeHtmlEntities(attrBrand); 
      } else {
        const genericCats = new Set([
          'bags', 'watches', 'jewelry', 'jewellery', 'accessories',
          'men', 'women', 'mens', 'womens', 'ladies', 'uncategorized',
          'paylater', 'pay-later', 'pay later'
        ]);
        const normalizedCatName = normalizeKey(catName);
        const isJewelryProduct =
          normalizedCatName === 'jewelry' ||
          normalizedCatName === 'jewellery' ||
          jewelryTypeKeywords.includes(normalizedCatName);

        const brandCategory = scraped.categories?.find((c: any) => {
          const name = c?.name || '';
          const normalized = normalizeKey(name);
          if (!normalized) return false;
          if (genericCats.has(normalized)) return false;
          if (normalized.includes('paylater')) return false; 
          if (normalizedCatName && normalized === normalizedCatName) return false;
          if (isJewelryProduct && isJewelryTypeCategory(name)) return false;
          if (isWatchTypeCategory(name)) return false;
          return true;
        });
        
        if (brandCategory) {
          brandName = decodeHtmlEntities(brandCategory.name);
        } else {
          brandName = scraped.name.split(' ')[0];
        }
      }

      if (normalizeKey(brandName).includes('paylater')) {
         brandName = scraped.name.split(' ')[0];
      }

      const baseStagingData = {
        scraped_ref_no: scraped.sku || `ORPHAN-${scraped.id}`, 
        scraped_name: scraped.name,
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
        const dbPrice = matchingDb.sale_price !== null ? matchingDb.sale_price : matchingDb.price;
        if (Math.abs(dbPrice - finalPrice) > 0.01) {
          stagingPayload.push({
            ...baseStagingData,
            scraped_ref_no: matchingDb.ref_no || baseStagingData.scraped_ref_no, 
            sync_status: 'pending'
          });
          updateCount++;
        }
      }
    }

    for (const dbProduct of relevantDbProducts) {
      const isStillInReference = allScrapedProducts.some(scraped => isSameProduct(dbProduct, scraped));
      
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
    // 💾 6. SAVE TO STAGING TABLE
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