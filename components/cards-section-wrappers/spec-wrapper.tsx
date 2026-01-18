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
      }?${queryString}`
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/${tableName}/available-brands`
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/categories/${tableName}/sub-categories`
    ),
  ]);

  // Safely parse JSON only when response is OK and content-type is JSON
  async function safeJson(res: Response) {
    if (!res) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || !contentType.includes("application/json")) return null;
    try {
      return await res.json();
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      return null;
    }
  }

  const [data, brandList, catList] = await Promise.all([
    safeJson(dataRes),
    safeJson(brandListRes),
    safeJson(subCategoriesRes),
  ]);

  return (
    <CardsSection
      products={data?.products || []}
      subBrandsList={data?.subBrands || []}
      pageInfo={data?.page ?? null}
      brandsList={Array.isArray(brandList) ? brandList : []}
      colorsList={data?.colors ?? null}
      subCategoryList={Array.isArray(catList) ? catList : null}
    />
  );
}
