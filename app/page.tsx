import About from '@/components/homepage/about-us';
import FeaturedBrands from '@/components/homepage/featured-brands';
import FeaturedWatches from '@/components/homepage/featured-watches';
import Hero from '@/components/homepage/hero';
import Maps from '@/components/homepage/maps';
import PatekBrand from '@/components/homepage/patek-brand';
import RolexBrand from '@/components/homepage/rolex-brand';
import SalesInfo from '@/components/homepage/sales-info';

export default async function Page() {
  return (
    <div className="section-style relative bg-[url('/homepage-assets/homebg.webp')] bg-cover bg-center bg-no-repeat">
      <Hero />
      <SalesInfo />
      <FeaturedBrands />
      <FeaturedWatches />
      <About />
      <RolexBrand />
      <PatekBrand />
      <Maps />
    </div>
  );
}
