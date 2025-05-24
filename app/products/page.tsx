import Banner from "@/components/banner";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import CardsSectionWrapper from "@/components/cards-section-wrappers/products-overview";
import { FiltersParams } from "@/lib/types";
import { Suspense } from "react";
const NO_OF_ITEMS = "18";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<FiltersParams>;
}) {
  const { page, color, gender, name, brand, sub_category, sub_brand } =
    await searchParams;

  const paramsMap = {
    page: isValidString(page) ? page : "1",
    color: isValidString(color) ? color : null,
    gender: isValidString(gender) ? gender : null,
    name: isValidString(name) ? name : null,
    brand: isValidString(sub_brand)
      ? sub_brand
      : isValidString(brand)
      ? brand
      : null,
    sub_category: isValidString(sub_category) ? sub_category : null,
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
