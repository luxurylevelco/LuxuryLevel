import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==========================================
// 🧠 1. ANG SMART MATCHER MO 
// ==========================================
function normalizeNameKey(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function isSameProduct(dbProduct: any, scrapedProduct: any): boolean {
  if (dbProduct.ref_no && scrapedProduct.sku) {
    if (dbProduct.ref_no === scrapedProduct.sku) return true;
  }

  const dbName = normalizeNameKey(dbProduct.name) || "";
  const listName = normalizeNameKey(scrapedProduct.name) || "";

  if (dbName && listName) {
    if (dbName === listName) return true;
    if (dbName.length > 12 && listName.length > 12) {
      if (dbName.includes(listName) || listName.includes(dbName)) return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let categoryToScrape = (body.category || 'all').toLowerCase(); 

    console.log(`🚀 Starting SMART COMPARISON Scraper for: ${categoryToScrape.toUpperCase()}`);

    // ==========================================
    // 🗄️ 2. FETCH EXISTING DB PRODUCTS
    // ==========================================
    console.log(`🔍 Fetching existing local database products...`);
    
    const { data: rawProducts, error: dbError } = await supabaseAdmin
      .from('product')
      .select('id, ref_no, name, price, sale_price, category_id');
      
    if (dbError) throw new Error(`DB Error: ${dbError.message}`);

    const { data: rawCategories } = await supabaseAdmin
      .from('category')
      .select('id, name');

    const dbProducts = (rawProducts || []).map(p => ({
      ...p,
      category: {
        name: rawCategories?.find(c => c.id === p.category_id)?.name || 'Unknown'
      }
    }));

    const relevantDbProducts = categoryToScrape === 'all' 
      ? dbProducts 
      : dbProducts.filter(p => {
          const catName = p.category?.name?.toLowerCase() || '';
          if (categoryToScrape === 'jewelry') return catName.includes('jewel') || catName.includes('ring') || catName.includes('bracelet');
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
    while (hasMore && page <= 3) {
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
      const matchingDb = relevantDbProducts.find(dbP => isSameProduct(dbP, scraped));
      
      // Fixed Price parsing
      const finalPrice = parseFloat(scraped.prices?.price || '0');

      // 🧠 SMART BRAND EXTRACTOR
      let brandName = 'Unbranded';
      const attrBrand = scraped.attributes?.find((a: any) => a.name.toLowerCase() === 'brand')?.terms?.[0]?.name;
      
      if (attrBrand) {
        brandName = attrBrand;
      } else {
        // LuxurySouq puts brands in categories. We ignore generic category words to find the brand.
        const genericCats = ['bags', 'watches', 'jewelry', 'jewellery', 'accessories', 'men', 'women', 'uncategorized'];
        const brandCategory = scraped.categories?.find((c: any) => !genericCats.includes(c.name.toLowerCase()));
        
        if (brandCategory) {
          brandName = brandCategory.name; // e.g. "Hermes" or "Rolex"
        } else {
          // Absolute fallback: First word of the product name
          brandName = scraped.name.split(' ')[0];
        }
      }

      // 🧠 SMART CATEGORY EXTRACTOR (Includes Subcategories)
      let catName = categoryToScrape === 'all' ? 'Unknown' : categoryToScrape;
      
      // Combine name and categories to search for keywords
      const searchSpace = (scraped.name + ' ' + (scraped.categories?.map((c:any) => c.name).join(' ') || '')).toLowerCase();

      if (searchSpace.includes('ring')) catName = 'ring';
      else if (searchSpace.includes('bracelet')) catName = 'bracelet';
      else if (searchSpace.includes('cufflink')) catName = 'cufflink';
      else if (searchSpace.includes('bridal')) catName = 'bridal';
      else if (searchSpace.includes('necklace')) catName = 'necklace';
      else if (searchSpace.includes('earring') || searchSpace.includes('earrings')) catName = 'earrings';
      else if (searchSpace.includes('watch') || searchSpace.includes('timepiece')) catName = 'watches';
      else if (searchSpace.includes('bag') || searchSpace.includes('tote') || searchSpace.includes('clutch') || searchSpace.includes('handbag')) catName = 'bags';

      const baseStagingData = {
        scraped_ref_no: scraped.sku || `ORPHAN-${scraped.id}`, 
        scraped_name: scraped.name,
        scraped_price: finalPrice,
        raw_brand_name: brandName,    // 👈 Ito ay Hermes na!
        raw_category_name: catName,   // 👈 Ito ay bags/ring/bracelet na!
        image_url: scraped.images?.[0]?.src || null,
        image_url_2: scraped.images?.[1]?.src || null,
        image_url_3: scraped.images?.[2]?.src || null,
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

    // B. Check for Orphans
    for (const dbProduct of relevantDbProducts) {
      const isStillInReference = allScrapedProducts.some(scraped => isSameProduct(dbProduct, scraped));
      
      if (!isStillInReference) {
        stagingPayload.push({
          scraped_ref_no: dbProduct.ref_no || `DB-ORPHAN-${dbProduct.id}`,
          scraped_name: dbProduct.name,
          scraped_price: null, 
          raw_brand_name: 'Unknown',
          raw_category_name: dbProduct.category?.name || 'Unknown',
          sync_status: 'missing' 
        });
        orphanCount++;
      }
    }

    // ==========================================
    // 💾 5. SAVE TO STAGING TABLE
    // ==========================================
    if (stagingPayload.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('staging_products')
        .upsert(stagingPayload, { 
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