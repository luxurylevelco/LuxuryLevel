'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RelatedProducts from './related-products';

// Interfaces
export interface ProductImagesProps {
  imgSrc1: string;
  imgSrc2: string;
  imgSrc3: string;
  className?: string;
}

export interface ProductSpecsProps {
  productName: string;
  price?: string;
  refNo?: string;
  color?: string;
  gender?: string;
  className?: string;
}

export interface BrandingProps {
  brandName?: string;
  brandLogo?: string;
  className?: string;
}

export interface DescriptionProps {
  description: string;
}

export interface ProductInfosProps {
  descTitle: string;
  descInfo: string;
}

export interface ProductDetailsProps {
  prodDetailsLabel: string;
  prodDetailsInfo: string;
}

// Data
export const ProductImagesData: ProductImagesProps[] = [
  {
    imgSrc1: '/rolex-watches/rolexday-watch.webp',
    imgSrc2: '/rolex-watches/rolexday2-watch.webp',
    imgSrc3: '/rolex-watches/rolexday-watch.webp',
  },
];

export const ProductSpecsData: ProductSpecsProps[] = [
  {
    productName:
      'Franck Muller V32 S6 SQT Rose D MVT D OG RG Vanguard Lady Rose',
    price: 'AED85,000.00',
    refNo: 'V32 S6 SQT Rose D MVT D OG RG',
    color: 'Gray',
    gender: 'Female',
  },
];

export const BrandingData: BrandingProps[] = [
  {
    brandName: 'FRANCK MULLER',
    brandLogo: '/logos/franckmuller-logo.webp',
  },
];

export const DescriptionData: DescriptionProps = {
  description:
    'Experience the epitome of luxury and sophistication with the Frank Muller V32 S6 SQT Rose D MVT D OG RG Vanguard Lady Rose Skeleton Ladies Watch. This exquisite timepiece is a true masterpiece, combining intricate craftsmanship with timeless elegance.',
};

export const ProductInfosData: ProductInfosProps[] = [
  {
    descTitle: 'Crafted to Perfection',
    descInfo:
      'The watch showcases a stunning 18-carat white gold case that exudes opulence. The 750 gold alloy case and bezel form a harmonious blend of beauty and durability. The bezel is adorned with brilliant diamonds, boasting a total carat weight of 3.55 kt. The 302 gemstones on the bezel add a touch of glamour to this already resplendent timepiece.',
  },
  {
    descTitle: 'A Glimpse into the Mechanism',
    descInfo:
      'Equipped with the caliber 1540 VS11 movement, this watch operates with utmost precision. With a semi-oscillation rate of 21,600 per hour, the timekeeping is impeccable. The manual winding feature adds a touch of tradition to the watch, allowing you to connect with its inner workings.',
  },
  {
    descTitle: 'Attention to Detail',
    descInfo:
      'The meticulous attention to detail is evident in every aspect of this watch. The scratch-resistant sapphire glass ensures that your timepiece remains pristine for years to come. The alligator leather bracelet not only adds a luxurious touch but also ensures comfortable wear.',
  },
  {
    descTitle: 'Functionality and Style Combined',
    descInfo:
      'The Frank Muller V32 S6 SQT Rose D MVT D OG RG Vanguard Lady Rose Skeleton Ladies Watch offers more than just timekeeping. The hour, minute, and second hands provide precise time readings, while the three-pointer watch type adds to its classic appeal. The water resistance of 3 bar (30 meters) splash-proof ensures your watch is protected even in daily activities.',
  },
  {
    descTitle: 'A Part of the Franck Muller Vanguard Collection',
    descInfo:
      'This timepiece belongs to the renowned Franck Muller Vanguard collection, known for its avant-garde designs and exceptional craftsmanship. The 32mm case diameter and 9.9mm case height make it a perfect fit for any wrist, combining elegance with comfort seamlessly.',
  },
  {
    descTitle: 'A Touch of Luxury with Every Clasp',
    descInfo:
      'The folding clasp of the watch is adorned with 12 diamonds, totaling 0.21ct, adding a touch of luxury with every wear. The clasp and case alloys are both 18-carat gold, showcasing a commitment to quality and elegance.',
  },
  {
    descTitle: 'Make a Statement',
    descInfo:
      'Owning the Frank Muller V32 S6 SQT Rose D MVT D OG RG Vanguard Lady Rose Skeleton Ladies Watch is more than owning a timepiece – it’s owning a statement of luxury, sophistication, and style. Elevate your ensemble with this exquisite watch that harmonizes intricate craftsmanship with timeless design.',
  },
];

export const ProductDetailsData: ProductDetailsProps[] = [
  {
    prodDetailsLabel: 'Reference Number:',
    prodDetailsInfo: ' Frank Muller V32 S6 SQT Rose D MVT D OG RG',
  },
  { prodDetailsLabel: 'Caliber:', prodDetailsInfo: ' 1540 VS11' },
  {
    prodDetailsLabel: 'Semi-Oscillations:',
    prodDetailsInfo: ' 21,600 per hour',
  },
  {
    prodDetailsLabel: 'Case Alloy:',
    prodDetailsInfo: ' 750 (18-carat) white gold',
  },
  {
    prodDetailsLabel: 'Bezel Alloy:',
    prodDetailsInfo: ' 750 (18-carat) white gold',
  },
  { prodDetailsLabel: 'Bezel Gemstone:', prodDetailsInfo: ' Diamond' },
  { prodDetailsLabel: 'Carat of Bezel:', prodDetailsInfo: ' 3.55 kt' },
  { prodDetailsLabel: 'Watch Case Length:', prodDetailsInfo: ' 42.3 mm' },
  { prodDetailsLabel: 'Watch Type:', prodDetailsInfo: ' Three pointer' },
  {
    prodDetailsLabel: 'Collection:',
    prodDetailsInfo: ' Franck Muller Vanguard',
  },
  { prodDetailsLabel: 'Case Height:', prodDetailsInfo: ' 9.9 mm' },
  { prodDetailsLabel: 'Winding:', prodDetailsInfo: ' Manual winding' },
  {
    prodDetailsLabel: 'Functionalities:',
    prodDetailsInfo: ' Hour hand, Minute hand, Second hand',
  },
  { prodDetailsLabel: 'Case Diameter:', prodDetailsInfo: ' 32 mm' },
  {
    prodDetailsLabel: 'Water Resistance:',
    prodDetailsInfo: ' 3 bar (30 meters) splash-proof',
  },
  { prodDetailsLabel: 'Clasp Type:', prodDetailsInfo: ' Folding clasp' },
];

function ZoomableImage({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top, width, height } =
      containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className='relative w-[450px] h-[450px] overflow-hidden'
    >
      <Image
        src={src}
        alt='Zoomed Product Image'
        width={450}
        height={450}
        className={`object-cover transition-transform duration-300 ${
          isHovering ? 'cursor-zoom-in scale-150' : 'scale-100'
        }`}
        style={{
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
      />
    </div>
  );
}

// Component
export default function ProductPage() {
  const product = ProductSpecsData[0];
  const brand = BrandingData[0];
  const images = ProductImagesData[0];

  const imageSources = [images.imgSrc1, images.imgSrc2, images.imgSrc3];
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? imageSources.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) =>
      prev === imageSources.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <div className='bg-white w-full min-h-screen 2xl:px-72 2xl:py-40 flex flex-col gap-20'>
      <div className='h-fit w-full flex flex-row justify-between'>
        {/* Product Images */}
        <div className='w-1/3 flex flex-col gap-4'>
          {/* Main Display Image with Navigation */}
          <div className='relative w-fit'>
            <ZoomableImage src={imageSources[currentIndex]} />

            {/* Navigation Buttons */}
            <button
              onClick={goToPrev}
              className='absolute top-1/2 left-0 transform -translate-y-1/2 text-gray-300 text-7xl hover:text-black z-10'
            >
              ‹
            </button>
            <button
              onClick={goToNext}
              className='absolute top-1/2 right-0 transform -translate-y-1/2 text-gray-300 text-7xl hover:text-black z-10'
            >
              ›
            </button>
          </div>

          {/* Thumbnails */}
          <div className='flex gap-2'>
            {imageSources.map((src, index) => (
              <Image
                key={index}
                src={src}
                alt={`Thumbnail ${index + 1}`}
                width={100}
                height={100}
                className={`cursor-pointer hover:-translate-y-1 transition-transform duration-300 ${
                  currentIndex === index ? '' : 'bg-black opacity-50'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Product Specs */}
        <div className='w-1/3 flex flex-col gap-5'>
          <p className='text-3xl font-semibold'>{product.productName}</p>

          <p className='text-gray-500'>
            Our price:{' '}
            <span className='text-xl text-green-700 font-bold'>
              {product.price}
            </span>
          </p>

          <p className='font-semibold text-gray-500 italic'>
            ** Prices and availability subject to change at any time and does
            not constitute a contract **
          </p>

          <div className='flex justify-between border-b'>
            <span>Ref No:</span>
            <span>{product.refNo || 'N/A'}</span>
          </div>

          <div className='flex justify-between border-b'>
            <span>Color:</span>
            <span>{product.color || 'N/A'}</span>
          </div>

          <div className='flex justify-between border-b'>
            <span>Gender:</span>
            <span>{product.gender || 'N/A'}</span>
          </div>
        </div>

        {/* Divider */}
        <div className='border-r border-gray-300' />

        {/* Brand Info */}
        <div className='w-60 flex flex-col items-center'>
          <p className='text-lg font-semibold'>{brand.brandName}</p>
          <Link href='/brands/'>
            <Image
              src={brand.brandLogo!}
              alt={brand.brandName!}
              width={180}
              height={180}
              className='cursor-pointer'
            />
          </Link>
        </div>
      </div>

      {/* Description Placeholder */}
      <div className='h-fit flex flex-col items-start text-lg gap-6'>
        <div className='flex flex-col gap-3'>
          <p className='font-bold text-3xl'>Description</p>
          <p>{DescriptionData.description}</p>
          <div className='mt-10 border-b' />
        </div>

        <div className='flex flex-col gap-6 mt-10'>
          {ProductInfosData.map((info, index) => (
            <div key={index}>
              <p className='font-bold text-2xl'>{info.descTitle}</p>
              <p>{info.descInfo}</p>
            </div>
          ))}
        </div>

        <div className='bg-gray-100 rounded-lg w-full h-fit mt-10 p-10'>
          <p className='font-bold text-2xl mb-4'>Watch Specification</p>
          <ul className='list-disc pl-5 space-y-2'>
            {ProductDetailsData.map((details, index) => (
              <li key={index}>
                <p className='font-bold'>
                  {details.prodDetailsLabel}{' '}
                  <span className='font-normal'>{details.prodDetailsInfo}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Related Products */}
      <div>
        <RelatedProducts />
      </div>
    </div>
  );
}
