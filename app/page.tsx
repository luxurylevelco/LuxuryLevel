import About from '@/components/homepage/about-us';
import FeaturedBrands from '@/components/homepage/featured-brands';
import FeaturedWatches from '@/components/homepage/featured-watches';
import Hero from '@/components/homepage/hero';
import Maps from '@/components/homepage/maps';
import SalesInfo from '@/components/homepage/sales-info';

export default async function Page() {
  return (
    <>
      <Hero />
      <SalesInfo />
      <FeaturedBrands />
      <FeaturedWatches />
      <About />
      <Maps />
    </>
  );
}
