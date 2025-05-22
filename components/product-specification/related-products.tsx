'use client';

import Link from 'next/link';
import { useState } from 'react';
import ProductCard, { ProductCardProps } from '../product-card';

export const relatedProdData: ProductCardProps[] = [
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

const PRODUCTS_PER_PAGE = 4;

export default function RelatedProducts() {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(relatedProdData.length / PRODUCTS_PER_PAGE);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const startIdx = currentPage * PRODUCTS_PER_PAGE;
  const currentProducts = relatedProdData.slice(
    startIdx,
    startIdx + PRODUCTS_PER_PAGE
  );

  return (
    <div className='section-style bg-white py-10 px-5 w-full h-fit flex flex-col gap-10'>
      {/* Header */}
      <div className='flex w-full items-center flex-col'>
        <p className='font-semibold text-3xl'>Related Products</p>
      </div>

      {/* Product Grid with Side Arrows */}
      <div className='relative flex items-center justify-center'>
        {/* Navigation Buttons */}
        <button
          onClick={handlePrev}
          className='absolute top-1/2 left-0 transform -translate-y-1/2 text-gray-300 text-7xl hover:text-black z-10'
        >
          ‹
        </button>

        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {currentProducts.map((prod, idx) => (
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

        <button
          onClick={handleNext}
          className='absolute top-1/2 right-0 transform -translate-y-1/2 text-gray-300 text-7xl hover:text-black z-10'
        >
          ›
        </button>
      </div>
    </div>
  );
}
