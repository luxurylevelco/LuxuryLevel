import Banner from "@/components/banner";
import CardsSection from "@/components/cards-section";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    page: string | null;
    color: string | null;
    gender: string | null;
    name: string | null;
    sub_category: string | null;
    brand: string | null;
    sub_brand: string | null;
  }>;
}) {
  // assume this is inside an async fn, e.g. a React useEffect or getServerSideProps
  const { page, color, gender, name, sub_category, brand, sub_brand } =
    await searchParams;

  const _params = new URLSearchParams({
    noOfItems: "18",
  });

  if (page) _params.set("page", page);
  if (color) _params.set("color", color);
  if (brand) _params.set("brand", sub_brand || brand);
  if (gender) _params.set("gender", gender);
  if (name) _params.set("name", name);
  if (sub_category) _params.set("sub_category", sub_category);

  const queryString = _params.toString();

  const [resbags, resBrandInfo, brandsRes] = await Promise.all([
    fetch(`${process.env.API_URL}/api/products?${queryString}`),
    fetch(`${process.env.API_URL}/api/brands/${brand}/information`),
    fetch(`${process.env.API_URL}/api/brands`),
  ]);

  const [productData, brandInfo, brandsList] = await Promise.all([
    resbags.json(),
    resBrandInfo.json(),
    brandsRes.json(),
  ]);

  return (
    <>
      <Banner title={brandInfo.name} classnameForBgSrc={""} />
      <CardsSection
        products={productData.products || []}
        subBrandsList={productData.subBrand || []}
        pageInfo={productData.page ?? null}
        brandsList={brandsList.brands}
        colorsList={productData.colors ?? null}
        subCategoryList={null}
        pathname={`products`}
      />
    </>
  );
}
