import Image from 'next/image';

import { Roboto_Condensed } from 'next/font/google';

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['400', '700'],
});

interface SalesInfoProps {
  iconSrc: string;
  label: string;
  sublabel: string;
}

const salesInfoData: SalesInfoProps[] = [
  {
    iconSrc: '/svgs/truck.svg',
    label: 'International Delivery',
    sublabel: 'Express international shipping by DHL',
  },
  {
    iconSrc: '/svgs/bank.svg',
    label: 'Flexible Payment',
    sublabel: 'Convenient payments for every purchase',
  },
  {
    iconSrc: '/svgs/check-badge.svg',
    label: 'Authenticity',
    sublabel: 'Our all luxury watches are 100% genuine',
  },
  {
    iconSrc: '/svgs/whatsapp.svg',
    label: 'WhatsApp Service',
    sublabel: 'Contact us anytime, anywhere',
  },
];

export function SalesInfoCard({ iconSrc, label, sublabel }: SalesInfoProps) {
  return (
    <div className='flex flex-col md:flex-row items-center justify-center gap-4 p-8'>
      <Image src={iconSrc} alt={label} width={32} height={32} />
      <div className='text-center'>
        <div className='font-semibold text-xl'>{label}</div>
        <div className='text-sm text-black'>{sublabel}</div>
      </div>
    </div>
  );
}

export default function SalesInfo() {
  return (
    <div
      className={`${robotoCondensed.className} section-style bg-white h-fit md:h-[100px] flex flex-col md:flex-row justify-center items-center`}
    >
      {salesInfoData.map((item, idx) => (
        <SalesInfoCard key={idx} {...item} />
      ))}
    </div>
  );
}
