import CardsSectionWrapper from "@/components/cards-section-wrappers/brands-products";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import { Suspense } from "react";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{
    id: string | null;
  }>;
  searchParams: Promise<{
    page: string | null;
    color: string | null;
    gender: string | null;
    name: string | null;
    sub_category: string | null;
    sub_brand: string | null;
  }>;
}) {
  // assume this is inside an async fn, e.g. a React useEffect or getServerSideProps
  const { id: brand } = await params;

  // assume this is inside an async fn, e.g. a React useEffect or getServerSideProps
  const { page, color, gender, name, sub_category, sub_brand } =
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

  return (
    <>
      <Suspense fallback={<CardsSectionLoading />}>
        <CardsSectionWrapper queryString={queryString} brand={brand} />
      </Suspense>
    </>
  );
}
