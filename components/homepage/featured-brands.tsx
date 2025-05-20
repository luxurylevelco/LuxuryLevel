import Link from "next/link";
import BrandCard, { BrandCardProps } from "../brand-card";

export const brandCardData: BrandCardProps[] = [
  {
    imgSrc: "/homepage-assets/patek-watch.webp",
    href: "/brands/",
  },
  {
    imgSrc: "/homepage-assets/rolex-watch.webp",
    href: "/brands/",
  },
  {
    imgSrc: "/homepage-assets/audemars-watch.webp",
    href: "/brands/",
  },
  {
    imgSrc: "/homepage-assets/richardmille-watch.webp",
    href: "/brands/",
  },
  {
    imgSrc: "/homepage-assets/fpjourne-watch.webp",
    href: "/brands/",
  },
  {
    imgSrc: "/homepage-assets/vacheron-watch.webp",
    href: "/brands/",
  },
];

export default function FeaturedBrands() {
  return (
    <div className="section-style py-10 px-5 w-full h-fit flex flex-col gap-10">
      <div className="flex w-full items-center flex-col">
        <p className="font-semibold text-4xl text-black">Featured Brands</p>
        <p className="text-lg pt-10 text-black">
          Discover an unparalled selection of luxury watches from the
          world&apos;s top brands.
        </p>
      </div>
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {brandCardData.map((brand, idx) => (
            <BrandCard key={idx} imgSrc={brand.imgSrc} href={brand.href} />
          ))}
        </div>
      </div>

      <Link href="/" className="flex justify-center">
        <div className="cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block">
          Explore All Brands
        </div>
      </Link>
    </div>
  );
}
