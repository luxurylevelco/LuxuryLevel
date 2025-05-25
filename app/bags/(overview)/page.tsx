import Banner from "@/components/banner";
import CardsSectionWrapper from "@/components/cards-section-wrappers/spec-wrapper";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import { Suspense } from "react";
import { FiltersParams } from "@/lib/types";
import { isValidString, NO_OF_ITEMS } from "@/lib/utils";

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
