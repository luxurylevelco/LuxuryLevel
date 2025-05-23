import Banner from "@/components/banner";
import CardsSection from "@/components/cards-section";

export default async function CardsSectionWrapper({
  queryString,
  brand,
}: {
  queryString: string;
  brand: string | null;
}) {
  const [resbags, resBrandInfo] = await Promise.all([
    fetch(`${process.env.API_URL}/api/products?${queryString}`),
    fetch(`${process.env.API_URL}/api/brands/${brand}/information`),
  ]);

  const [brandProductList, brandInfo] = await Promise.all([
    resbags.json(),
    resBrandInfo.json(),
  ]);

  return (
    <>
      <Banner title={brandInfo.name} classnameForBgSrc={""} />
      <CardsSection
        products={brandProductList.products || []}
        pageInfo={brandProductList.page ?? null}
        brandsList={null}
        colorsList={brandProductList.colors ?? null}
        subCategoryList={null}
        subBrandsList={brandProductList.subBrands}
        pathname={`brands/${brand}`}
      />
    </>
  );
}
