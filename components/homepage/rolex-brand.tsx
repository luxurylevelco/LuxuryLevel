import Link from 'next/link';
import ProductCard, { ProductCardProps } from '../product-card';
import Image from 'next/image';

export const rolexBrandData: ProductCardProps[] = [
  {
    imgSrc: '/rolex-watches/rolexpepsi-watch.webp',
    hoverImgSrc: '/rolex-watches/rolexpepsi2-watch.webp',
    productName:
      'Rolex Gmt Master II 126710BLRO-0001 Pepsi Oystersteel Jubilee Bracelet Black Dial',
    price: 'AED89,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/rolex-watches/rolexpepsiwhitegold-watch.webp',
    hoverImgSrc: '/rolex-watches/rolexpepsiwhitegold2-watch.webp',
    productName:
      'Rolex GMT Master II 126719BLRO Automatic 18 ct White Gold Pepsi Bezel Meteorite Dial',
    price: 'AED220,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/rolex-watches/rolexyacht-watch.webp',
    hoverImgSrc: '/rolex-watches/rolexyacht2-watch.webp',
    productName:
      'Rolex Yacht Master 126621-0001 18K Everose Gold Chocolate Dial',
    price: 'AED72,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/rolex-watches/rolexday-watch.webp',
    hoverImgSrc: '/rolex-watches/rolexday2-watch.webp',
    productName:
      'Rolex Day-Date 228238-0059 Yellow Gold Onyx Baguette Black Dial',
    price: 'AED240,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/rolex-watches/rolexdaytona-watch.webp',
    hoverImgSrc: '/rolex-watches/rolexdaytona2-watch.webp',
    productName:
      'Rolex Daytona 126505 Rose Gold Sundust Dial with Black Sub Dials',
    price: 'AED220,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/rolex-watches/rolexyellowgold-watch.webp',
    hoverImgSrc: '/rolex-watches/rolexyellowgold2-watch.webp',
    productName:
      'Rolex GMT Master II Oyester Perpetual 126718GRNR 18 ct Yellow Gold Black Dial',
    price: 'AED160,000.00',
    href: '/watches',
  },
];

export default function RolexBrand() {
  return (
    <div className='section-style bg-white py-10 px-5 w-full h-fit flex flex-col gap-10 border-b border-black'>
      <div className='flex w-full items-center flex-col'>
        <Image
          src='/homepage-assets/rolex-logo.webp'
          alt='Rolex'
          height={180}
          width={180}
          className='object-contain'
        />
      </div>
      <div>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
          {rolexBrandData.map((prod, idx) => (
            <ProductCard
              key={idx}
              imgSrc={prod.imgSrc}
              hoverImgSrc={prod.hoverImgSrc}
              href={prod.href}
              productName={prod.productName}
              price={prod.price}
              className='border-none'
            />
          ))}
        </div>
      </div>

      <Link href='/' className='flex justify-center'>
        <div className='cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block'>
          Explore More
        </div>
      </Link>
    </div>
  );
}
