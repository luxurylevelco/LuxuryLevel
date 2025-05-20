import Image from 'next/image';
import Link from 'next/link';

export interface ProductCardProps {
  imgSrc: string;
  hoverImgSrc?: string;
  productName: string;
  price: string;
  href: string;
}

export default function ProductCard({
  imgSrc,
  hoverImgSrc,
  productName,
  price,
  href,
}: ProductCardProps) {
  return (
    <Link href={href} className='block'>
      <div className='h-[350px] w-full border border-gray-200 overflow-hidden group transition duration-300 flex flex-col p-4'>
        {/* Image container */}
        <div className='relative h-2/3 w-full'>
          {/* Stacked images */}
          <div className='absolute inset-0'>
            <Image
              src={imgSrc}
              alt={productName}
              fill
              className='object-cover transition-opacity duration-300 group-hover:opacity-0'
            />
          </div>
          {hoverImgSrc && (
            <div className='absolute inset-0'>
              <Image
                src={hoverImgSrc}
                alt={`${productName} (Hover)`}
                fill
                className='object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100'
              />
            </div>
          )}
        </div>

        {/* Info section */}
        <div className='h-1/3 flex flex-col justify-center items-center text-center bg-white'>
          <p className='text-lg text-black truncate w-full'>{productName}</p>
          <p className='text-green-700 font-semibold text-md pt-2'>{price}</p>
        </div>
      </div>
    </Link>
  );
}
