import CardsSectionWrapper from "@/components/cards-section-wrappers/brands-products";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import { FiltersParams } from "@/lib/types";
import { isValidString, NO_OF_ITEMS } from "@/lib/utils";
import { Suspense } from "react";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string | null }>;
  searchParams: Promise<FiltersParams>;
}) {
  const { id: brand } = await params;

  const { page, color, gender, name, subBrand, subCategory } =
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

  const _params = new URLSearchParams();
  for (const [key, value] of Object.entries(paramsMap)) {
    if (value) _params.set(key, value);
  }

  const queryString = _params.toString();

  return (
    <>
      <Suspense fallback={<CardsSectionLoading />}>
        <CardsSectionWrapper queryString={queryString} brand={brand} />
      </Suspense>
    </>
  );
}
