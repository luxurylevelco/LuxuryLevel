import Link from "next/link";
import ProductCard from "@/components/product-card";
import { ProductCardProps } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";
import { calculateFinalPriceUSD, formatUSD } from "@/lib/pricing";

export default function FeaturedWatches({
  data,
}: {
  data: ProductCardProps[];
}) {
  return (
    <div className="bg-white p-10 xl:px-20 2xl:px-60 w-full h-fit flex flex-col gap-10">
      <div className="flex w-full items-center flex-col">
        <p className="font-semibold text-4xl text-black">Featured Watches</p>
      </div>
      <div>
        {data.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {data.map((prod, idx) => (
              <ProductCard
                key={idx}
                imgSrc={prod.image_1 ?? "/placeholder-image.webp"}
                hoverImgSrc={prod.image_3 || prod.image_2 || prod.image_1}
                href={`/products/${prod.id}`}
                productName={prod.name}
                price={prod.price} // Tanggap na nito ang formatted USD string ($)
                //salePrice={prod.salePrice || prod.sale_price} // Ipasa ang sale price kung mayroon
              />
            ))}
          </div>
        ) : (
          <div className="w-full flex justify-center items-center">
            No Featured Watches
          </div>
        )}
      </div>

      <Link href="/watches" className="flex justify-center">
        <div className="cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block">
          Explore All Watches
        </div>
      </Link>
    </div>
  );
}

export async function FeaturedWatchesWrapper({
  category,
  brandName,
  limit,
}: {
  category: string;
  brandName?: string;
  limit?: string;
}) {
  try {
    const params = new URLSearchParams();

    if (brandName) params.set("brand", brandName);
    if (limit) params.set("limit", limit);

    const queryString = params.toString();

    // 1. Fetch products galing sa API mo
    const dataRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${category}/featured?${queryString}`
    );

    if (!dataRes.ok) {
      throw new Error(`Failed to fetch: ${dataRes.statusText}`);
    }

    const data: { products: any[] } = await dataRes.json();

    // 2. Fetch Pricing Settings galing Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: settings } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .single();

    const usdRate = settings?.usd_to_aed_rate || 3.67;
    const markup = settings?.markup_percentage || 10;

    // 3. I-map at i-compute ang USD para sa bawat product
    const productsWithConvertedPrice: ProductCardProps[] = (data.products || []).map((prod) => {
      // Convert main price
      const basePrice = prod.price || 0;
      const finalUSD = calculateFinalPriceUSD(basePrice, usdRate, markup);
      
      // Convert sale price kung mayroon
      let finalSaleUSD = null;
      if (prod.sale_price) {
        finalSaleUSD = calculateFinalPriceUSD(prod.sale_price, usdRate, markup);
      }

      return {
        ...prod,
        // Override natin ang price ng formatted USD string
        price: formatUSD(finalUSD),
        salePrice: finalSaleUSD ? formatUSD(finalSaleUSD) : null,
      };
    });

    return <FeaturedWatches data={productsWithConvertedPrice} />;
  } catch (error) {
    console.error("Error fetching featured watches:", error);
    return null;
  }
}