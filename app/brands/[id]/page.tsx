import Banner from "@/components/banner";
import CardsSection from "@/components/cards-section";
import { BrandResponse } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string | null }>;
}) {
  const { id } = await params;

  const data = await fetch(`${process.env.API_URL}/api/brands/${id}`, {
    method: "GET",
  });

  const _data: BrandResponse = await data.json();

  if (!id) {
    notFound();
  }

  console.log(_data);

  return (
    <>
      <Banner title={_data.brandDetails.name} classnameForBgSrc={""} />
      <div className="section-style"></div>
      <CardsSection products={_data.products} />
    </>
  );
}
