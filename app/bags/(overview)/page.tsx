import Banner from "@/components/banner";
import CardsSectionWrapper from "@/components/cards-section-wrappers/spec-wrapper";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import { Suspense } from "react";
import { FiltersParams } from "@/lib/types";
import { isValidString, NO_OF_ITEMS } from "@/lib/utils";
import { Metadata } from "next";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<FiltersParams>;
}): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "https://luxurylevel.com";

  const { name } = await searchParams;

  // Use the `name` for dynamic title fallback
  const pageName = isValidString(name) ? name : "Bags";

  return {
    title: `${pageName} | Luxury Level`,
    description: `Explore the best collection of ${pageName.toLowerCase()} at Luxury Level. Premium quality, top brands, and stylish designs.`,
    keywords: [
      "bags",
      "buy bags online",
      "stylish bags",
      "designer bags",
      "men bags",
      "women bags",
      pageName.toLowerCase(),
    ],
    openGraph: {
      title: `${pageName} | Luxury Level`,
      description: `Discover premium ${pageName.toLowerCase()} from Luxury Level's exclusive collection.`,
      url: `${baseUrl}/bags`,
      images: [
        {
          url: `${baseUrl}/banners/bags.webp`,
          alt: `${pageName} Collection Banner`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageName} | Luxury Level`,
      description: `Shop top-quality ${pageName.toLowerCase()} at Luxury Level.`,
      images: [`${baseUrl}/banners/bags.webp`],
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
    subCategory: isValidString(subCategory) ? subCategory : null,
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
        title="BAGS"
        classnameForBgSrc="bg-[url(/banners/bags.webp)] bg-[center_top_30%] "
      />
      <Suspense fallback={<CardsSectionLoading />}>
        <CardsSectionWrapper
          queryString={queryString}
          sub_category={subCategory}
          tableName="bags"
        />
      </Suspense>
    </>
  );
}
