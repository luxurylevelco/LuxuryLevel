import Image from 'next/image';
import Link from 'next/link';

export interface BrandCardProps {
  imgSrc: string;
  href: string;
}

export default function BrandCard({ imgSrc, href }: BrandCardProps) {
  return (
    <Link href={href} className='block'>
      <div className='relative h-[450px] w-full bg-gray-300 rounded-xl border-4 border-yellow-700 overflow-hidden transform transition duration-300 hover:scale-90'>
        <Image src={imgSrc} alt='Watch' fill className='object-cover' />
      </div>
    </Link>
  );
}
