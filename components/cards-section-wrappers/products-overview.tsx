import CardsSection from "@/components/cards-section";

export default async function CardsSectionWrapper({
  queryString,
}: {
  queryString: string;
}) {
  const [resbags, brandsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}//products?${queryString}`, {
      next: { revalidate: 60 },
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}//brands`, {
      next: { revalidate: 60 },
    }),
  ]);

  const [productData, brandsList] = await Promise.all([
    resbags.json(),
    brandsRes.json(),
  ]);

  return (
    <CardsSection
      products={productData.products || []}
      subBrandsList={productData.subBrand || []}
      pageInfo={productData.page ?? null}
      brandsList={brandsList.brands}
      colorsList={productData.colors ?? null}
      subCategoryList={null}
      pathname={`products`}
    />
  );
}
