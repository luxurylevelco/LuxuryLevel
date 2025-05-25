import Banner from "@/components/banner";
import CardsSectionWrapper from "@/components/cards-section-wrappers/spec-wrapper";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import { Suspense } from "react";
import { FiltersParams } from "@/lib/types";
import { isValidString, NO_OF_ITEMS } from "@/lib/utils";
import { Metadata } from "next";

// Dynamic SEO metadata using searchParams
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<FiltersParams>;
}): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "https://luxurylevel.com";
  const { name } = await searchParams;
  const pageName = isValidString(name) ? name : "Jewelry";

  return {
    title: `${pageName} | Luxury Jewelry Collection | Luxury Level`,
    description: `Explore Luxury Level's exquisite collection of high-end ${pageName.toLowerCase()}. Discover timeless designs crafted with elegance and precision.`,
    keywords: [
      "luxury jewelry",
      "high-end jewelry",
      "designer jewelry",
      "fine jewelry online",
      "Luxury Level",
      "gold and diamond jewelry",
      pageName.toLowerCase(),
    ],
    openGraph: {
      title: `${pageName} | Luxury Jewelry Collection | Luxury Level`,
      description: `Shop our premium selection of luxury ${pageName.toLowerCase()}, including gold, diamond, and designer pieces crafted to perfection.`,
      url: `${baseUrl}/jewelry`,
      images: [
        {
          url: `${baseUrl}/banners/jewelry.webp`,
          alt: `Elegant ${pageName} banner from Luxury Level`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Shop Luxury ${pageName} Online | Luxury Level`,
      description: `Discover our curated selection of premium ${pageName.toLowerCase()} at Luxury Level. Perfect for gifting or self-indulgence.`,
      images: [`${baseUrl}/banners/jewelry.webp`],
    },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<FiltersParams>;
}) {
  const { page, color, gender, name, brand, subCategory, subBrand } =
    await searchParams;

  const paramsMap = {
    page: isValidString(page) ? page : "1",
    color: isValidString(color) ? color : null,
    gender: isValidString(gender) ? gender : null,
    name: isValidString(name) ? name : null,
    brand: isValidString(subBrand)
      ? subBrand
      : isValidString(brand)
      ? brand
      : null,
    sub_category: isValidString(subCategory) ? subCategory : null,
    noOfItems: NO_OF_ITEMS,
  };

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(paramsMap)) {
    if (value) params.set(key, value);
  }
  const queryString = params.toString();

  return (
    <>
      <Banner
        title={"JEWELRIES"}
        classnameForBgSrc="bg-[url(/banners/jewelry.webp)] bg-[center_top_40%] "
      />
      <Suspense fallback={<CardsSectionLoading />}>
        <CardsSectionWrapper
          queryString={queryString}
          sub_category={subCategory}
          tableName="jewelry"
        />
      </Suspense>
    </>
  );
}
