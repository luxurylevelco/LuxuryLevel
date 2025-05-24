import Banner from "@/components/banner";
import CardsSectionWrapper from "@/components/cards-section-wrappers/spec-wrapper";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import { Suspense } from "react";
import { FiltersParams } from "@/lib/types";

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
        title="BAGS"
        classnameForBgSrc="bg-[url(/banners/bags.webp)] bg-[center_top_30%] "
      />
      <Suspense fallback={<CardsSectionLoading />}>
        <CardsSectionWrapper
          queryString={queryString}
          sub_category={sub_category}
          tableName="bags"
          pathname="bags"
        />
      </Suspense>
    </>
  );
}
