import Link from 'next/link';
import ProductCard from '../product-card';
import Image from 'next/image';
import { FeaturedResponse } from '@/lib/types';

export default async function FeaturedBrandProducts({
  brandInfo,
  products,
}: FeaturedResponse) {
  return (
    <div className='section-style bg-white py-10 px-5 w-full h-fit flex flex-col gap-10 border-b border-black'>
      <div className='flex w-full items-center flex-col'>
        <Image
          src={brandInfo?.logo_url || '/placeholder-image.webp'}
          alt='Rolex'
          height={180}
          width={180}
          className='object-contain'
        />
      </div>
      <div>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
          {products.map((prod, idx) => (
            <ProductCard
              key={idx}
              imgSrc={prod.image_1 || '/placeholder-image.webp'}
              hoverImgSrc={prod.image_3 || prod.image_2 || prod.image_1}
              href={`/products/${prod.id}`}
              productName={prod.name}
              price={String(prod.price) || null}
              className='border-none'
            />
          ))}
        </div>
      </div>

      <Link href={`/brands/${brandInfo?.id}`} className='flex justify-center'>
        <div className='cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block'>
          Explore More
        </div>
      </Link>
    </div>
  );
}
export async function FeaturedBrandProductsWrapper({
  category,
  brandName,
  limit,
}: {
  category: string;
  brandName: string;
  limit?: string;
}) {
  try {
    const params = new URLSearchParams();

    if (brandName) params.set('brand', brandName);
    if (limit) params.set('limit', limit);

    const queryString = params.toString();

    const dataRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/products/${category}/featured?${queryString}`
    );

    if (!dataRes.ok) {
      throw new Error(`Failed to fetch: ${dataRes.statusText}`);
    }

    const data: FeaturedResponse = await dataRes.json();

    return (
      <FeaturedBrandProducts
        brandInfo={data.brandInfo}
        products={data.products}
      />
    );
  } catch (error) {
    console.error('Error fetching featured brand products:', error);
    return null;
  }
}
