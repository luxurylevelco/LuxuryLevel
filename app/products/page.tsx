import Banner from "@/components/banner";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import CardsSectionWrapper from "@/components/cards-section-wrappers/products-overview";
import { FiltersParams } from "@/lib/types";
import { isValidString, NO_OF_ITEMS } from "@/lib/utils";
import { Suspense } from "react";
import { Metadata } from "next";

// SEO Metadata
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<FiltersParams>;
}): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "https://luxurylevel.com";
  const { name } = await searchParams;

  const pageTitle = isValidString(name)
    ? `${name} Collection | Luxury Level`
    : "All Products | Luxury Level";

  const description = isValidString(name)
    ? `Explore the ${name} collection at Luxury Level — curated luxury items with unmatched craftsmanship and style.`
    : "Browse the complete product range at Luxury Level. Discover high-end fashion, accessories, and timeless luxury collections.";

  const imageUrl = `${baseUrl}/banners/watches.webp`;

  return {
    title: pageTitle,
    description,
    keywords: [
      "Luxury Level",
      "all products",
      "luxury collection",
      "designer fashion",
      "premium accessories",
      ...(isValidString(name) ? [name] : []),
    ],
    openGraph: {
      title: pageTitle,
      description,
      url: `${baseUrl}/products`,
      images: [
        {
          url: imageUrl,
          alt: `${
            isValidString(name) ? name : "All Products"
          } Banner from Luxury Level`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [imageUrl],
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
        title={name || "All Products"}
        classnameForBgSrc="bg-[url(/banners/watches.webp)] bg-[center_top_30%] "
      />
      <Suspense fallback={<CardsSectionLoading />}>
        <CardsSectionWrapper queryString={queryString} />
      </Suspense>
    </>
  );
}
