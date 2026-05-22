import ProductInfo from "@/components/product-specification/product-page";
import { ProductInformationResponse } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";
import { calculateFinalPriceUSD, formatUSD } from "@/lib/pricing";

export default async function ProductPageWrapper({ id }: { id: string }) {
  const resData = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/products/${id}/information`,
    {
      method: "GET",
      next: { revalidate: 0 },
    }
  );

  const data: any = await resData.json();

  // 🔥 BAGO: ANG SALBABIDA 🔥
  // Kung nag-error ang API (dahil man sa maling slug, walang internet, o walang product),
  // sasaluhin na niya ito at hindi niya hahayaang mag-crash ang app mo!
  if (!resData.ok || data.error || !data.productInfo) {
    console.error("❌ API FETCH ERROR:", data.error || "Missing productInfo");
    return (
      <div className="flex h-screen flex-col items-center justify-center text-slate-500 font-sans gap-4">
        <h2 className="text-xl font-bold text-slate-900">Oops! Something went wrong.</h2>
        <p className="text-sm">{data.error || "Product information could not be loaded."}</p>
      </div>
    );
  }

  // --- PRICING ENGINE LOGIC ---
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    }
  );

  const { data: settings } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const usdRate = settings?.usd_to_aed_rate || 3.67;
  const markup = settings?.markup_percentage || 10;

  // 1. I-convert ang presyo ng Main Product
  const mainBasePrice = data.productInfo.price || 0;
  const mainFinalUSD = calculateFinalPriceUSD(mainBasePrice, usdRate, markup);
  
  let mainSaleUSD = null;
  if (data.productInfo.sale_price) {
    mainSaleUSD = calculateFinalPriceUSD(data.productInfo.sale_price, usdRate, markup);
  }

  const updatedProductInfo = {
    ...data.productInfo,
    display_price: formatUSD(mainFinalUSD),
    display_sale_price: mainSaleUSD ? formatUSD(mainSaleUSD) : null,
  };

  // 2. I-convert din ang presyo ng Related Products sa ibaba ng page!
  const updatedRelatedProducts = (data.relatedProducts || []).map((prod: any) => {
    const basePrice = prod.price || 0;
    const finalUSD = calculateFinalPriceUSD(basePrice, usdRate, markup);
    
    let saleUSD = null;
    if (prod.sale_price) {
      saleUSD = calculateFinalPriceUSD(prod.sale_price, usdRate, markup);
    }
    
    return {
      ...prod,
      display_price: formatUSD(finalUSD), 
      price: formatUSD(finalUSD), 
      sale_price: saleUSD ? formatUSD(saleUSD) : null,
    };
  });

  const updatedData = {
    ...data,
    productInfo: updatedProductInfo, 
    relatedProducts: updatedRelatedProducts,
  };
  // ----------------------------

  return (
    <>
      <ProductInfo {...updatedData} />
    </>
  );
}