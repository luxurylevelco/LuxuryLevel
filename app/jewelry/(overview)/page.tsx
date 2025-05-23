import Banner from "@/components/banner";
import CardsSection from "@/components/cards-section";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    page: string | null;
    color: string | null;
    gender: string | null;
    brand: string | null;
    name: string | null;
    sub_category: string | null;
    sub_brand: string | null;
  }>;
}) {
  // assume this is inside an async fn, e.g. a React useEffect or getServerSideProps
  const { page, color, gender, name, brand, sub_category, sub_brand } =
    await searchParams;

  const params = new URLSearchParams({
    noOfItems: "18",
  });

  if (page) params.set("page", page);
  if (color) params.set("color", color);
  if (brand) params.set("brand", sub_brand || brand);
  if (gender) params.set("gender", gender);
  if (name) params.set("name", name);
  if (sub_category) params.set("sub_category", sub_category);

  const queryString = params.toString();

  const [resJewelry, resJewelryBrands, resJewelryCategories] =
    await Promise.all([
      fetch(
        `${process.env.API_URL}/api/products/${
          sub_category || "jewelry"
        }?${queryString}`
      ),
      fetch(`${process.env.API_URL}/api/categories/jewelry/available-brands`),
      fetch(`${process.env.API_URL}/api/categories/jewelry/sub-categories`),
    ]);

  const [jewelriesData, jewelriesBrandsList, jewelryCatsList] =
    await Promise.all([
      resJewelry.json(),
      resJewelryBrands.json(),
      resJewelryCategories.json(),
    ]);

  return (
    <>
      <Banner title={"JEWELRIES"} classnameForBgSrc={""} />
      <CardsSection
        products={jewelriesData.products || []}
        pageInfo={jewelriesData.page ?? null}
        brandsList={jewelriesBrandsList}
        colorsList={jewelriesData.colors ?? null}
        pathname="jewelry"
        subBrandsList={jewelriesData.sub_brand}
        subCategoryList={jewelryCatsList}
      />
    </>
  );
}
