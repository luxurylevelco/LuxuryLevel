import Link from 'next/link';
import ProductCard, { ProductCardProps } from '../product-card';
import Image from 'next/image';

export const patekBrandData: ProductCardProps[] = [
  {
    imgSrc: '/patek-watches/patekblackdial-watch.webp',
    hoverImgSrc: '/patek-watches/patekblackdial2-watch.webp',
    productName: 'Patek Philippe Aquanaut 5167A-001 Black Dial Arabic Numerals',
    price: 'AED304,500.00',
    href: '/watches',
  },
  {
    imgSrc: '/patek-watches/pateknautilisbluedial-watch.webp',
    hoverImgSrc: '/patek-watches/pateknautilisbluedial2-watch.webp',
    productName:
      'Patek Philippe Nautilus 5712/1A-001 Moon Phase 40mm Blue Dial Mens Watch',
    price: 'AED550,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/patek-watches/pateknautilisrosegold-watch.webp',
    hoverImgSrc: '/patek-watches/pateknautilisrosegold2-watch.webp',
    productName:
      'Patek Philippe Nautilus 7118/1200R-010 18K Rose Gold Golden Brown Opaline Dial',
    price: 'AED543,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/patek-watches/patekaquanautblue-watch.webp',
    hoverImgSrc: '/patek-watches/patekaquanautblue2-watch.webp',
    productName: 'Patek Philippe Aquanaut 5168G-001 Blue Embossed Dial Jumbo',
    price: 'AED323,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/patek-watches/pateknautilusblueopaline-watch.webp',
    hoverImgSrc: '/patek-watches/pateknautilusblueopaline2-watch.webp',
    productName:
      'Patek Philippe Nautilus 7118/1200A-001 Blue Opaline Index Dial Diamond-Set Bezel Stainless Steel 35mm Blue Dial Womens Watch',
    price: 'AED315,500.00',
    href: '/watches',
  },
  {
    imgSrc: '/patek-watches/patekcalatrava-watch.webp',
    hoverImgSrc: '/patek-watches/patekcalatrava2-watch.webp',
    productName: 'Patek Philippe Calatrava 6007G-010 18Kt White Gold',
    price: 'AED140,000.00',
    href: '/watches',
  },
];

export default function PatekBrand() {
  return (
    <div className='section-style bg-white py-10 px-5 w-full h-fit flex flex-col gap-10'>
      <div className='flex w-full items-center flex-col'>
        <Image
          src='/homepage-assets/patek-logo.webp'
          alt='Patek'
          height={180}
          width={180}
          className='object-contain'
        />
      </div>
      <div>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
          {patekBrandData.map((prod, idx) => (
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
