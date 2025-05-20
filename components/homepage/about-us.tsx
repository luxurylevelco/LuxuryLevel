import Link from 'next/link';
import Image from 'next/image';

export default function About() {
  return (
    <div className='page-style flex flex-row w-full h-fit py-10 2xl:px-72 gap-10'>
      {/* Left side */}
      <div className='flex flex-col justify-center items-center w-1/2 gap-10'>
        <div>
          <p className='font-semibold text-4xl text-black'>ABOUT US</p>
        </div>
        <div className='flex flex-col gap-5 text-center'>
          <p>
            Luxury Souq was founded by an Emirati Entrepreneur in the United
            Arab Emirates, under the patronage of His Highness Sheikh Mohammed
            Bin Rashid Establishment (Dubai SME). The concept of Luxury Souq
            came to life in 2013.
          </p>
          <p>
            LUXURY SOUQ is privately owned by the luxury watches connoisseur
            Khaled Mohamed Ebrahimi. He is the second generation of family
            business trading in luxury watches. His passion for luxury watches
            encouraged him to continue his studies in Switzerland.
          </p>
        </div>
        <div>
          <Link href='/' className='flex justify-center'>
            <div className='cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block'>
              Know more
            </div>
          </Link>
        </div>
      </div>

      {/* Right side (Image) */}
      <div className='w-1/2 flex justify-center items-center'>
        <div className='relative w-full h-[500px]'>
          <Image
            src='/homepage-assets/about-us.webp'
            alt='About Us Image'
            fill
            className='object-cover'
          />
        </div>
      </div>
    </div>
  );
}
