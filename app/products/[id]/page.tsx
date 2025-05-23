import CardsSectionLoading from "@/components/cards-section-wrappers/loading";
import ProductPageWrapper from "@/components/product-specification/product-page-wrapper";

import { Suspense } from "react";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<CardsSectionLoading />}>
      <ProductPageWrapper id={id} />
    </Suspense>
  );
}
