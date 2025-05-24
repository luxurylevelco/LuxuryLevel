import BrandCard from "@/components/brand-card";
import { Brand } from "@/lib/types";
import Link from "next/link";

export default async function FeaturedBrands() {
  const dataRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}//brands/featured`,
    {
      next: { revalidate: 60 },
    }
  );

  const featuredBrands: Brand[] = await dataRes.json();

  return (
    <div className="section-style py-10 px-10 md:px-20 w-full h-fit flex flex-col md:gap-10">
      <div className="flex w-full items-center flex-col">
        <p className="font-semibold text-4xl text-black">Featured Brands</p>
        <p className="text-lg pt-10 text-black text-center">
          Discover an unparalled selection of luxury watches from the
          world&apos;s top brands.
        </p>
      </div>
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 py-4">
          {featuredBrands.map((brand, idx) => (
            <BrandCard
              key={idx}
              imgSrc={brand.logo_url || "/placeholder-image.webp"}
              href={`/brands/${brand.id}/`}
            />
          ))}
        </div>
      </div>

      <Link href="/brands" className="flex justify-center">
        <div className="cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block">
          Explore All Brands
        </div>
      </Link>
    </div>
  );
}
