import Banner from "@/components/banner";
import BrandCard from "@/components/brand-card";
import { Brand } from "@/lib/types";

export default async function Page() {
  const resBrands = await fetch(`${process.env.API_URL}/api/brands`, {
    method: "GET",
  });

  const _brands = await resBrands.json();
  const brands: Brand[] = _brands.brands;

  return (
    <>
      <Banner title={"OUR BRANDS"} classnameForBgSrc={""} />
      <div className="padding min-h-screen bg-white space-y-10 xl:px-60">
        {/* Header  */}
        <div className="text-center space-y-4">
          <p className="text-lg font-bold ">
            We Buy and Sell World&apos;s Most Luxury Watch Brands
          </p>
          <p className="text-lg font-normal ">
            We are not an official dealer for the products we sell and have no
            affiliation with the manufacturer. <br /> All brand names and
            trademarks are the property of their respective owners and are used
            for identification purposes only.
          </p>
        </div>
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-6 ">
          {brands.map((brand) => (
            <BrandCard
              imgSrc={brand.logo_url || "/placeholder-image.webp"}
              href={`/brands/${brand.id}`}
              key={brand.id}
              desc={brand.description ?? ""}
            />
          ))}
        </div>
      </div>
    </>
  );
}
