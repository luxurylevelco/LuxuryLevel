import Banner from "@/components/banner";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import CardsSectionWrapper from "@/components/cards-section-wrappers/spec-wrapper";
import { FiltersParams } from "@/lib/types";
import { isValidString, NO_OF_ITEMS } from "@/lib/utils";
import { Suspense } from "react";
import { Metadata } from "next";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<FiltersParams>;
}): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "https://luxurylevel.com";
  const { name } = await searchParams;

  const pageName = isValidString(name) ? name : "Watches";

  return {
    title: `${pageName} | Luxury Level`,
    description: `Discover premium ${pageName.toLowerCase()} at Luxury Level. Top quality, style, and durability.`,
    keywords: [
      "watches",
      "luxury watches",
      "buy watches online",
      "men watches",
      "women watches",
      pageName.toLowerCase(),
    ],
    openGraph: {
      title: `${pageName} | Luxury Level`,
      description: `Explore Luxury Level's exclusive collection of ${pageName.toLowerCase()}.`,
      url: `${baseUrl}/watches`,
      images: [
        {
          url: `${baseUrl}/banners/watches.webp`,
          alt: `${pageName} Collection Banner`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${pageName} | Luxury Level`,
      description: `Shop high-quality ${pageName.toLowerCase()} at Luxury Level.`,
      images: [`${baseUrl}/banners/watches.webp`],
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
        title={"WATCHES"}
        classnameForBgSrc="bg-[url(/banners/watches.webp)] bg-[center_top_10%] "
      />
      <Suspense fallback={<CardsSectionLoading />}>
        <CardsSectionWrapper
          queryString={queryString}
          sub_category={subCategory}
          tableName={"watches"}
        />
      </Suspense>
    </>
  );
}
