import Link from 'next/link';
import ProductCard from '@/components/product-card';
import { ProductCardProps } from '@/lib/types';

export default function FeaturedWatches({
  data,
}: {
  data: ProductCardProps[];
}) {
  return (
    <div className='bg-white p-10 xl:px-20 2xl:px-60 w-full h-fit flex flex-col gap-10'>
      <div className='flex w-full items-center flex-col'>
        <p className='font-semibold text-4xl text-black'>Featured Watches</p>
      </div>
      <div>
        {data.length > 0 ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
            {data.map((prod, idx) => (
              <ProductCard
                key={idx}
                imgSrc={prod.image_1 ?? '/placeholder-image.webp'}
                hoverImgSrc={prod.image_3 || prod.image_2 || prod.image_1}
                href={`/products/${prod.id}`}
                productName={prod.name}
                price={String(prod.price) || null}
              />
            ))}
          </div>
        ) : (
          <div className='w-full flex justify-center items-center'>
            No Featured Watches
          </div>
        )}
      </div>

      <Link href='/watches' className='flex justify-center'>
        <div className='cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block'>
          Explore All Watches
        </div>
      </Link>
    </div>
  );
}

export async function FeaturedWatchesWrapper({
  category,
  brandName,
  limit,
}: {
  category: string;
  brandName?: string;
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

    const data: { products: ProductCardProps[] } = await dataRes.json();

    return <FeaturedWatches data={data.products || []} />;
  } catch (error) {
    console.error('Error fetching featured watches:', error);
    return null;
  }
}
