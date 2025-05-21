import Image from 'next/image';
import Link from 'next/link';
import { Roboto_Condensed } from 'next/font/google';

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function Footer() {
  return (
    <footer className='footer p-0'>
      <div>
        <div className='bg-gray-200 w-full h-fit flex flex-row gap-10 p-20 justify-center items-center'>
          <div className='flex flex-col w-1/4 items-start gap-5'>
            <div className='flex flex-col items-center'>
              <Image
                src='/svgs/level-logo.svg'
                alt='Whatsapp'
                width={85}
                height={85}
                className='object-contain'
              />
              <p className='font-semibold text-3xl'>Luxury Level</p>
            </div>
            <div>
              <Link href='/' className='underline'>
                Unit 117, 1st Floor, Al Shafar Building 7, Al Wasl Road,
                Jumeirah 1, Dubai, UAE
              </Link>
            </div>
            <div>
              <p>
                <strong>Timings:-</strong>11:30 AM to 8:30 PM{' '}
                <strong>(Saturday to Thursday)</strong>
              </p>
              <p>
                3:30 PM to 8:30 PM
                <strong>(Friday)</strong>
              </p>
            </div>
          </div>
          <div className={`${robotoCondensed.className}`}>
            <p className='font-semibold text-xl'>USEFUL LINKS</p>
          </div>
        </div>
        <div className='bg-default-black'>hahhahahaha</div>
      </div>
    </footer>
  );
}
