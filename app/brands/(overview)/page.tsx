import Banner from "@/components/banner";
import BrandCard from "@/components/brand-card";
import { Brand } from "@/lib/types";

export default async function Page() {
  let brands: Brand[] = [];

  try {
    const resBrands = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}//brands`,
      {
        method: "GET",
        next: { revalidate: 60 },
      }
    );
    if (!resBrands.ok)
      throw new Error(`Failed to fetch brands: ${resBrands.status}`);
    const _brands = await resBrands.json();
    brands = _brands.brands || [];
  } catch (error) {
    console.error("Fetch error in BrandsPage:", error);
  }

  return (
    <>
      <Banner
        title={"OUR BRANDS"}
        classnameForBgSrc="bg-[url(/banners/watches.webp)] bg-[center_top_10%] "
      />
      <div className="padding min-h-screen bg-white space-y-10 xl:px-60">
        <div className="text-center space-y-4">
          <p className="text-lg font-bold">
            We Buy and Sell World&apos;s Most Luxury Watch Brands
          </p>
          <p className="text-lg font-normal">
            We are not an official dealer for the products we sell and have no
            affiliation with the manufacturer. <br /> All brand names and
            trademarks are the property of their respective owners and are used
            for identification purposes only.
          </p>
        </div>
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.length > 0 ? (
            brands.map((brand) => (
              <BrandCard
                imgSrc={brand.logo_url || "/placeholder-image.webp"}
                href={`/brands/${brand.id}`}
                key={brand.id}
                desc={brand.description ?? ""}
              />
            ))
          ) : (
            <p>No brands available.</p>
          )}
        </div>
      </div>
    </>
  );
}
