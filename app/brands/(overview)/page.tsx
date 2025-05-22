import Banner from '@/components/banner';
import CardsSection from '@/components/cards-section';

export default async function Page() {
  return (
    <>
      <Banner title={'OUR BRANDS'} classnameForBgSrc={''} />
      <div className='padding min-h-screen bg-white'>
        {/* Header  */}
        <div className='text-center space-y-4'>
          <p className='text-lg font-bold '>
            We Buy and Sell World's Most Luxury Watch Brands
          </p>
          <p className='text-lg font-normal '>
            We are not an official dealer for the products we sell and have no
            affiliation with the manufacturer. <br /> All brand names and
            trademarks are the property of their respective owners and are used
            for identification purposes only.
          </p>
        </div>
      </div>
    </>
  );
}
