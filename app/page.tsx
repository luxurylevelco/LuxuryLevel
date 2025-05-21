import About from '@/components/homepage/about-us';
import FeaturedBrands from '@/components/homepage/featured-brands';
import FeaturedWatches from '@/components/homepage/featured-watches';
import Hero from '@/components/homepage/hero';
import Maps from '@/components/homepage/maps';
import PatekBrand from '@/components/homepage/patek-brand';
import RolexBrand from '@/components/homepage/rolex-brand';
import SalesInfo from '@/components/homepage/sales-info';
import TrustedSeller from '@/components/homepage/trusted-seller';
import VipDiscount from '@/components/homepage/vip-discount';
import Disclaimer from '@/components/homepage/disclaimer';
import Footer from '@/components/homepage/footer';

export default async function Page() {
  return (
    <>
      <Hero />
      <SalesInfo />
      <FeaturedBrands />
      <FeaturedWatches />
      <About />
      <RolexBrand />
      <PatekBrand />
      <TrustedSeller />
      <VipDiscount />
      <Disclaimer />
    </>
  );
}
