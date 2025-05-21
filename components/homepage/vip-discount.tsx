import Link from 'next/link';
import Image from 'next/image';

export default function VipDiscount() {
  return (
    <div className='page-style flex flex-row w-full h-fit py-10 2xl:px-72 gap-10'>
      {/* Left side */}
      <div className='flex flex-col justify-center items-center w-1/2 gap-10'>
        <div>
          <p className='font-semibold text-4xl text-black'>VIP DISCOUNT</p>
        </div>
        <div className='flex flex-col gap-5 text-center'>
          <p>
            We always have special deals and big discounts for our loyal and
            valued customers. If you love expensive watches and admire their
            beauty, you should get the best savings. Our VIP club is made for
            watch lovers and those who enjoy buying top quality timepieces. When
            you join our private group, you will get access to amazing discounts
            that will make your shopping experience even better.
          </p>
          <p>
            Join our VIP club today and grab the best prices on luxury watches.
            As a member, you will receive exclusive deals on the most popular
            high-end brands, helping you expand your collection with class and
            style. Don’t miss this chance to enjoy these special perks, and
            experience the true joy of being a VIP customer.
          </p>
        </div>
      </div>

      {/* Right side (Image) */}
      <div className='w-1/2 flex justify-center items-center'>
        <div className='relative w-full h-[500px]'>
          <Image
            src='/homepage-assets/vipdisc.webp'
            alt='About Us Image'
            fill
            className='object-cover'
          />
        </div>
      </div>
    </div>
  );
}
