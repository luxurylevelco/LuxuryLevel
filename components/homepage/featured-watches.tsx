import Link from 'next/link';
import ProductCard, { ProductCardProps } from '../product-card';

export const productCardData: ProductCardProps[] = [
  {
    imgSrc: '/watches/chopardimperial-watch.webp',
    hoverImgSrc: '/watches/chopardimperial2-watch.webp',
    productName: 'Chopard Imperiale 384319-5004 Automatic 18Kt Rose Gold',
    price: 'AED78,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/omegaspeedmaster-watch.webp',
    hoverImgSrc: '/watches/omegaspeedmaster2-watch.webp',
    productName:
      'Omega Speedmaster 310.32.42.50.02.001 ‘Silver Snoopy Award’ 50Th Anniversary',
    price: 'AED76,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/audemarspiguet-watch.webp',
    hoverImgSrc: '/watches/audemarspiguet2-watch.webp',
    productName:
      'Audemars Piguet Code 11.59 Automatic 26393Bc.Oo.A002Cr.01 Chronograph',
    price: 'AED99,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/patek-watch.webp',
    hoverImgSrc: '/watches/patek2-watch.webp',
    productName:
      'Patek Philippe Aquanaut Luce 5267/200A-010 Matted Diamond-Set Bezel Stainless 39mm Steel White Dial Womens Watch',
    price: 'AED255,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/bvlgarioctoroma-watch.webp',
    hoverImgSrc: '/watches/bvlgarioctoroma2-watch.webp',
    productName: 'Bvlgari Octo Roma Automatic Green Dial 41Mm Men’S Watch',
    price: 'AED29,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/franckmuller-watch.webp',
    hoverImgSrc: '/watches/franckmuller2-watch.webp',
    productName:
      'Franck Muller V32 S6 SQT Rose D MVT D OG RG Vanguard Lady Rose',
    price: 'AED85,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/piaget-watch.webp',
    hoverImgSrc: '/watches/piaget2-watch.webp',
    productName: 'Piaget Limelight Gala G0A39163 Quartz Rose Gold Dial',
    price: 'AED145,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/hyt-watch.webp',
    hoverImgSrc: '/watches/hyt2-watch.webp',
    productName: 'HYT H0 H01489 Manual Wind Silver Dial',
    price: 'AED111,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/rolexcosmogoldsilver-watch.webp',
    hoverImgSrc: '/watches/rolexcosmogoldsilver2-watch.webp',
    productName:
      'Rolex Cosmograph Daytona 126503-0003 Oystersteel And Yellow Gold Black Dial',
    price: 'AED99,000.00',
    href: '/watches',
  },
  {
    imgSrc: '/watches/rolexcosmosilver-watch.webp',
    hoverImgSrc: '/watches/rolexcosmosilver2-watch.webp',
    productName:
      'Rolex Cosmograph Daytona 126500LN-0001 Oyestersteel Automatic White Panda Index Dial',
    price: 'AED125,000.00',
    href: '/watches',
  },
];

export default function FeaturedWatches() {
  return (
    <div className='bg-white p-10 xl:px-20 2xl:px-60 w-full h-fit flex flex-col gap-10'>
      <div className='flex w-full items-center flex-col'>
        <p className='font-semibold text-4xl text-black'>Featured Watches</p>
      </div>
      <div>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
          {productCardData.map((prod, idx) => (
            <ProductCard
              key={idx}
              imgSrc={prod.imgSrc}
              hoverImgSrc={prod.hoverImgSrc}
              href={prod.href}
              productName={prod.productName}
              price={prod.price}
            />
          ))}
        </div>
      </div>

      <Link href='/' className='flex justify-center'>
        <div className='cursor-pointer bg-white text-black text-lg font-semibold px-6 py-2 border border-black hover:bg-black hover:text-white transition duration-300 transform hover:translate-y-3 inline-block'>
          Explore All Watches
        </div>
      </Link>
    </div>
  );
}
