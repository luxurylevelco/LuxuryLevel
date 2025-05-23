import Image from 'next/image';
import Link from 'next/link';

export default function LimitedEdition() {
  return (
    <div className='padding min-h-screen bg-white flex flex-col'>
      <div className='flex flex-row w-full h-fit 2xl:px-20 gap-10'>
        {/* Left side (Image) */}
        <div className='w-1/2 flex justify-center items-center'>
          <div className='relative w-full h-[500px]'>
            <Image
              src='/homepage-assets/limited-img.webp'
              alt='About Us Image'
              fill
              className='object-cover'
            />
          </div>
        </div>
        {/* Right side */}
        <div className='flex flex-col justify-center items-center w-1/2 gap-6'>
          <div>
            <p className='font-semibold text-4xl text-black'>
              LIMITED EDITION WATCHES
            </p>
          </div>
          <div className='flex flex-col gap-5 text-center'>
            <p>
              Introducing our highly coveted Limited Edition Watches, the
              epitome of rarity and exclusivity. These timepieces are
              exceptionally rare, with only a select few or even none in
              existence in any catalog.
            </p>
            <p>
              Meticulously handcrafted by master artisans, these watches
              showcase unparalleled craftsmanship and innovation. Each watch is
              a true collector’s item, featuring exquisite materials, intricate
              detailing, and a unique design.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
