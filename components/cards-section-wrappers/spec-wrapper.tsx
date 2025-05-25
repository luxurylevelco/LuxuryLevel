import CardsSection from "@/components/cards-section";

export default async function CardsSectionWrapper({
  queryString,
  sub_category,
  tableName,
}: {
  queryString: string;
  sub_category: string | null;
  tableName: string;
}) {
  const [dataRes, brandListRes, subCategoriesRes] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${
        sub_category || tableName
      }?${queryString}`,
      {
        next: { revalidate: 60 },
      }
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/${tableName}/available-brands`,
      {
        next: { revalidate: 60 },
      }
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/${tableName}/sub-categories`,
      {
        next: { revalidate: 60 },
      }
    ),
  ]);

  const [data, brandList, catList] = await Promise.all([
    dataRes.json(),
    brandListRes.json(),
    subCategoriesRes.json(),
  ]);

  return (
    <CardsSection
      products={data.products || []}
      subBrandsList={data.subBrands || []}
      pageInfo={data.page ?? null}
      brandsList={brandList}
      colorsList={data.colors ?? null}
      subCategoryList={catList}
    />
  );
}
