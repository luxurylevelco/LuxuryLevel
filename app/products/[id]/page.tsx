import ProductInfo from "@/components/product-specification/product-page";
import { ProductInformationResponse } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string | null }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const resData = await fetch(
    `${process.env.API_URL}/api/products/${id}/information`,
    {
      method: "GET",
    }
  );

  const data: ProductInformationResponse = await resData.json();

  return (
    <>
      <ProductInfo {...data} />
    </>
  );
}
