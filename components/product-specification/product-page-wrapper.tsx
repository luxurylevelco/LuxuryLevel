import ProductInfo from "@/components/product-specification/product-page";
import { ProductInformationResponse } from "@/lib/types";

export default async function ProductPageWrapper({ id }: { id: string }) {
  const resData = await fetch(
    `${process.env.API_URL}/api/products/${id}/information`,
    {
      method: "GET",
      next: { revalidate: 60 },
    }
  );

  const data: ProductInformationResponse = await resData.json();

  return (
    <>
      <ProductInfo {...data} />
    </>
  );
}
