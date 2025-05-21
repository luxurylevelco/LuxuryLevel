import Image from 'next/image';

export default function Hero() {
  return (
    <div className="section-style relative bg-[url('/homepage-assets/herobg.webp')] bg-cover bg-center bg-no-repeat p-20 bg-black">
      <div className='absolute bottom-28 left-24 flex flex-col w-[280px] h-fit'>
        <Image
          src='/homepage-assets/whatsapp-logo.webp'
          alt='Whatsapp'
          width={1000}
          height={500}
          className='w-full h-auto'
        />
        <div>
          <p className='font-semibold text-white text-2xl'>Follow Us On</p>
          <p className='font-bold text-white text-2xl'>Whatsapp Channel</p>
        </div>

        <div className='pt-5'>
          <p className='text-gray-400 text-lg'>
            Get First Access To New Arrivals
          </p>
          <p className='text-gray-400 text-lg'>Exclusive Offers And Updates</p>
        </div>
      </div>
    </div>
  );
}
