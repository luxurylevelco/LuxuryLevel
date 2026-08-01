import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadFileToR2 } from '@/lib/r2';
import { buildBrandIndex, matchBrandFromCandidates } from '@/lib/brand-matcher';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processAndUploadImage(url: string | null, refNo: string, index: number, category: string): Promise<string | null> {
  if (!url || !url.startsWith('http')) return url; 

  console.log(`[TRACKER] 📥 Downloading Image ${index}: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    let ext = '.jpg';
    if (contentType.includes('png')) ext = '.png';
    if (contentType.includes('webp')) ext = '.webp';

    const categoryFolder = category ? category.toLowerCase().replace(/[^a-z0-9]/g, '') : 'misc';
    const r2Key = `${categoryFolder}/${refNo}_${index}${ext}`; 

    console.log(`[TRACKER] ☁️ Uploading Image ${index} to Cloudflare as: ${r2Key}`);
    await uploadFileToR2(arrayBuffer, r2Key, contentType);
    
    console.log(`[TRACKER] ✅ Success Upload Image ${index}!`);
    return r2Key; 
  } catch (error) {
    console.error(`[TRACKER ERROR] ❌ Error in image ${index}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json().catch(() => ({}));
    const mappedBrand = body.mappedBrand;

    const resolvedParams = await params;
    const stagingId = resolvedParams.id; 
    console.log(`\n\n=========================================`);
    console.log(`[TRACKER 1] 🚀 API Called for Staging ID: ${stagingId}`);

    const adminId = 'dev_admin'; 
    console.log(`[TRACKER 2] 🔓 Auth Bypassed. Admin is: ${adminId}`);

    console.log(`[TRACKER 3] 🔍 Fetching from database...`);
    const { data: stagingData, error: fetchError } = await supabaseAdmin
      .from('staging_products')
      .select('*')
      .eq('id', stagingId)
      .limit(1)       // ✅ PREVENTS CRASH IF THERE ARE DUPLICATE IDs
      .maybeSingle(); // ✅ PREVENTS CRASH IF THE ID WAS DELETED

    if (fetchError) throw new Error(`DB Fetch Error: ${fetchError.message}`);
    if (!stagingData) throw new Error('Product not found in database (it may have been deleted)');

    const refNo = stagingData.scraped_ref_no || `prod_${stagingId}`;
    
    // ==========================================
    // 🧹 1. CATEGORY SANITIZER
    // ==========================================
    const rawCat = (stagingData.raw_category_name || 'products').toLowerCase();
    let standardCategory = stagingData.raw_category_name; 
    
    if (['ring', 'bracelet', 'cufflink', 'bridal'].includes(rawCat)) {
      standardCategory = rawCat.toUpperCase();
    }
    else if (rawCat.includes('watch') || rawCat.includes('timepiece')) {
      standardCategory = 'watches';
    } 
    else if (rawCat.includes('jewel')) {
      standardCategory = 'jewelry';
    }
    else if (rawCat.includes('bag')) { 
      standardCategory = 'bags';
    }
    else if (rawCat === 'unknown' || rawCat.includes('hermes') || rawCat.includes('chanel') || rawCat.includes('channel')) {
      standardCategory = 'bags'; 
    }

    const { data: brandRows, error: brandError } = await supabaseAdmin
      .from('brand')
      .select('name');

    if (brandError) throw new Error(`Brand fetch error: ${brandError.message}`);

    const brandIndex = buildBrandIndex((brandRows || []).map((row) => row.name));

    // ==========================================
    // 🧠 2. SMART BRAND SANITIZER (Case Insensitive + Aliases)
    // ==========================================
    let rawBrand = mappedBrand || stagingData.raw_brand_name || 'Unbranded';
    let standardBrand = 'Unbranded';
    const lowerRaw = rawBrand.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const matchedBrand = matchBrandFromCandidates(brandIndex, [
      mappedBrand,
      stagingData.raw_brand_name,
      stagingData.scraped_name,
    ]);

    if (matchedBrand) {
      standardBrand = matchedBrand;
    }

    // 🚫 A. Harangin ang mga "Fake Brands" (Non-brands)
    const garbageWords = ['cosmograph', 'cufflink', 'cufflinks', 'bracelet', 'ring', 'necklace', 'earring', 'bridal', 'paylater', 'unknown', 'n/a', '1', '2', '3'];
    const isGarbage = garbageWords.some(gw => lowerRaw === gw || (lowerRaw.includes(gw) && lowerRaw.length < 15));

    if (!matchedBrand && !isGarbage && lowerRaw !== 'unbranded') {
      
        // 🏆 B. Master List of Real Brands (Mula sa Screenshots mo: LuxurySouq + Level)
        const officialBrands = [
          "A. Lange & Sohne", "Arnold & Son", "Audemars Piguet", "Baltic", "Baume & Mercier",
          "Bell & Ross", "Blancpain", "Bomberg", "Boucheron", "Bovet", "Breguet", "Breitling",
          "Bvlgari", "Carl F. Bucherer", "Cartier", "Chanel", "Chaumet", "Chopard",
          "Christophe Claret", "Concord", "Corum", "Cvstos", "Daniel Roth", "De Bethune",
          "De Grisogono", "DeLacour", "Dewitt", "Dior", "Ebel", "F.P. Journe", "Favre-Leuba",
          "Ferdinand Berthoud", "Franc Vila", "Franck Muller", "Frederique Constant",
          "Furlan Marri", "Gerald Charles", "Gerald Genta", "Girard Perregaux",
          "Glashutte Original", "Graff", "Graham", "Greubel Forsey", "Gucci", "Guess",
          "H. Moser & Cie", "Hamilton", "Harry Winston", "Hautlence", "Hermes", "Hublot",
          "Hysek", "HYT", "IWC", "Jacob & Co", "Jaeger-LeCoultre", "Jaquet Droz",
          "Konstantin Chaykin", "Linde Werdelin", "Longines", "Maitres du Temps", "MB&F",
          "Messika", "Mido", "Monchard", "Montblanc", "Nomos Glashutte", "Omega", "Oris",
          "Panerai", "Parmigiani Fleurier", "Patek Philippe", "Piaget", "Pierre Kunz Geneve",
          "Quinting", "Ressence", "Richard Mille", "Roger Dubuis", "Rolex", "Romain Jerome",
          "Schwarz Etienne", "Seiko", "Sevenfriday", "Sinn", "Studio Underd0g", "Tag Heuer",
          "Timex", "Tudor", "Ulysse Nardin", "Urwerk", "Vacheron Constantin",
          "Van Cleef & Arpels", "Vulcain", "West End Watch Co", "Zenith", "Zentier"
        ];

        // 🔗 C. Smart Aliases & Partial Matches (Kung Patek lang, magiging Patek Philippe)
        if (lowerRaw.includes('patek')) standardBrand = 'Patek Philippe';
        else if (lowerRaw.includes('audemars') || lowerRaw === 'ap') standardBrand = 'Audemars Piguet';
        else if (lowerRaw.includes('vacheron') || lowerRaw === 'vc') standardBrand = 'Vacheron Constantin';
        else if (lowerRaw.includes('channel') || lowerRaw.includes('chanel')) standardBrand = 'Chanel';
        else if (lowerRaw.includes('bvlgari') || lowerRaw.includes('bulgari')) standardBrand = 'Bvlgari';
        else if (lowerRaw.includes('jaeger') || lowerRaw.includes('jlc')) standardBrand = 'Jaeger-LeCoultre';
        else if (lowerRaw.includes('lange')) standardBrand = 'A. Lange & Sohne';
        else if (lowerRaw.includes('f.p.')) standardBrand = 'F.P. Journe';
        else if (lowerRaw.includes('mille')) standardBrand = 'Richard Mille';
        else if (lowerRaw.includes('cleef')) standardBrand = 'Van Cleef & Arpels';
        else if (lowerRaw.includes('glashutte')) standardBrand = 'Glashutte Original';
        else if (lowerRaw.includes('rolex')) standardBrand = 'Rolex';
        else if (lowerRaw.includes('cartier')) standardBrand = 'Cartier';
        else if (lowerRaw.includes('omega')) standardBrand = 'Omega';
        else if (lowerRaw.includes('hermes')) standardBrand = 'Hermes';
        else {
           // Hanapin kung may match sa official list mo
           const matched = officialBrands.find(ob => {
              const obLower = ob.toLowerCase();
              return lowerRaw === obLower || lowerRaw.includes(obLower) || obLower.includes(lowerRaw);
           });
           if (matched) standardBrand = matched;
           else standardBrand = rawBrand; 
        }
    }

    // 💾 D. EXACT DB LOOKUP (Case-Insensitive check bago i-save)
    if (standardBrand !== 'Unbranded') {
      // Step 1: Subukang mag-ILike query (case-insensitive sa SQL)
      const { data: exactMatch } = await supabaseAdmin
        .from('brand')
        .select('name')
        .ilike('name', standardBrand)
        .maybeSingle();

      if (exactMatch) {
        standardBrand = exactMatch.name;
      } else {
        // Step 2: Kung nagkamali ng spelling sa DB mo, hahanapin natin manually
        const { data: allDbBrands } = await supabaseAdmin.from('brand').select('name');
        if (allDbBrands) {
          const fuzzyDbMatch = allDbBrands.find(b => 
             b.name.toLowerCase().includes(standardBrand.toLowerCase()) || 
             standardBrand.toLowerCase().includes(b.name.toLowerCase())
          );
          if (fuzzyDbMatch) standardBrand = fuzzyDbMatch.name;
        }
      }
    }

    console.log(`[TRACKER 4.5] 🏷️ Normalized Cat: '${standardCategory}' | Final Brand: '${standardBrand}'`);

    // ==========================================
    // ☁️ 3. CLOUDFLARE UPLOADS
    // ==========================================
    const image_1 = await processAndUploadImage(stagingData.image_url, refNo, 1, standardCategory);
    const image_2 = await processAndUploadImage(stagingData.image_url_2, refNo, 2, standardCategory);
    const image_3 = await processAndUploadImage(stagingData.image_url_3, refNo, 3, standardCategory);

    // ==========================================
    // 💾 4. STAGING UPDATE & RPC EXECUTION
    // ==========================================
    console.log(`[TRACKER 5] 💾 Updating staging table with clean data...`);
    const { error: updateError } = await supabaseAdmin
      .from('staging_products')
      .update({
        image_url: image_1 || stagingData.image_url,
        image_url_2: image_2 || stagingData.image_url_2,
        image_url_3: image_3 || stagingData.image_url_3,
        raw_category_name: standardCategory, 
        raw_brand_name: standardBrand        // 👈 Pasok na ang exact Brand Name mo rito!
      })
      .eq('id', stagingId);

    if (updateError) throw new Error(`Update Error: ${updateError.message}`);

    console.log(`[TRACKER 6] ⚙️ Calling SQL Function (approve_and_map_product)...`);
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('approve_and_map_product', {
      p_staging_id: parseInt(stagingId),
      p_approved_by: adminId,
    });

    if (rpcError) throw new Error(`RPC Error: ${rpcError.message}`);

    console.log(`[TRACKER 7] 🎉 EVERYTHING SUCCESSFUL!`);
    console.log(`=========================================\n\n`);

    return NextResponse.json({ success: true, message: 'Approved!' }, { status: 200 });

  } catch (error: any) {
    console.error('\n[TRACKER FATAL ERROR] 💥 System crashed at:', error.message);
    console.log(`=========================================\n\n`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}