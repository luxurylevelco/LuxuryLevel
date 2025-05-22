import Banner from '@/components/banner';
import CardsSection from '@/components/cards-section';
import ProductPage from '@/components/product-specification/product-page';
import { BrandResponse } from '@/lib/types';
import { notFound } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string | null }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <>
      <ProductPage />
    </>
  );
}
