import Link from 'next/link';
import Image from 'next/image';

export default function TrustedSeller() {
  return (
    <div className="section-style relative h-auto bg-[url('/homepage-assets/bg.webp')] bg-cover bg-center bg-no-repeat p-20 bg-black">
      <div className='absolute inset-0 bg-black opacity-70 z-0' />
      <div className='relative z-10 flex flex-col w-1/2 h-fit'>
        <div>
          <p className='font-semibold text-white text-7xl'>TRUSTED SELLER</p>
          <p className='text-white text-xl pt-10'>
            <span className='text-4xl'>B</span>uying a luxury watch is all about
            trust, and choosing the right seller is very important. A good
            seller helps and guides buyers to make the best choice.
          </p>
          <p className='text-white text-xl pt-5'>
            Trust is built over time with years of hard work, honesty, and great
            service. We have sold hundreds of luxury watches on Chrono24 Dubai
            and earned a strong reputation as a reliable and authentic seller.
          </p>
          <p className='text-white text-xl pt-5'>
            A trusted seller should have a real store where customers can visit
            and view a wide range of luxury watches. It’s also important to have
            a team of skilled professionals who offer expert advice and
            excellent service to help buyers make the right decision.
          </p>
          <p className='text-white text-xl pt-5'>
            We are proud to be a trusted partner of Chrono24 since 2014, with
            hundreds of successful checkouts. Our strong presence and commitment
            to providing the best service ensure that customers can buy with
            complete trust and confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
