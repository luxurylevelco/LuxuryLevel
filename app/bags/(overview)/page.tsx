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

  const [resbags, resbagsBrands, resbagsCategories] = await Promise.all([
    fetch(
      `${process.env.API_URL}/api/products/${
        sub_category || "bags"
      }?${queryString}`
    ),
    fetch(`${process.env.API_URL}/api/categories/bags/available-brands`),
    fetch(`${process.env.API_URL}/api/categories/bags/sub-categories`),
  ]);

  const [bagsData, bagsBrandsList, bagsCatsList] = await Promise.all([
    resbags.json(),
    resbagsBrands.json(),
    resbagsCategories.json(),
  ]);

  return (
    <>
      <Banner title={"BAGS"} classnameForBgSrc={""} />
      <CardsSection
        products={bagsData.products || []}
        pageInfo={bagsData.page ?? null}
        brandsList={bagsBrandsList}
        colorsList={bagsData.colors ?? null}
        subCategoryList={bagsCatsList}
        subBrandsList={bagsData.subBrands}
        pathname="bags"
      />
    </>
  );
}
