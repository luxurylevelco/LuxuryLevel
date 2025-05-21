import Image from 'next/image';

export default function Footer() {
  return (
    <footer className='footer p-0'>
      <div>
        <div className='default-white-bg w-full h-fit flex flex-row gap-10 p-20 justify-center items-center'>
          <div className='flex flex-col'>
            <div>
              <Image
                src='/svgs/level-logo.svg'
                alt='Whatsapp'
                width={50}
                height={50}
                className='w-full h-auto'
              />
            </div>
            <div>address</div>
            <div>schedule time</div>
          </div>
          <div>hahah</div>
          <div>hahahah</div>
          <div>hahahah</div>
        </div>
        <div className='bg-default-black'>hahhahahaha</div>
      </div>
    </footer>
  );
}
