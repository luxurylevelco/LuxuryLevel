import Banner from "@/components/banner";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import CardsSectionWrapper from "@/components/cards-section-wrappers/spec-wrapper";
import { FiltersParams } from "@/lib/types";
import { isValidString, NO_OF_ITEMS } from "@/lib/utils";
import { Suspense } from "react";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<FiltersParams>;
}) {
  // assume this is inside an async fn, e.g. a React useEffect or getServerSideProps
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
