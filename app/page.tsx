import About from "@/components/homepage/about-us";
import FeaturedBrands from "@/components/homepage/featured-brands";
import { FeaturedWatchesWrapper } from "@/components/homepage/featured-watches";
import Hero from "@/components/homepage/hero";
import { FeaturedBrandProductsWrapper } from "@/components/homepage/rolex-brand";
import SalesInfo from "@/components/homepage/sales-info";
import TrustedSeller from "@/components/homepage/trusted-seller";
import VipDiscount from "@/components/homepage/vip-discount";
import Disclaimer from "@/components/homepage/disclaimer";
import { Suspense } from "react";
import CardsSectionLoading from "@/components/cards-section-wrappers/loading";

export default async function Page() {
  return (
    <>
      <Hero />
      <SalesInfo />
      <FeaturedBrands />
      <Suspense fallback={<CardsSectionLoading />}>
        <FeaturedWatchesWrapper category={"watches"} limit={"10"} />
      </Suspense>
      <About />
      <Suspense fallback={<CardsSectionLoading />}>
        <FeaturedBrandProductsWrapper
          category={"watches"}
          limit={"6"}
          brandName={"Rolex"}
        />
      </Suspense>
      <Suspense fallback={<CardsSectionLoading />}>
        <FeaturedBrandProductsWrapper
          category={"watches"}
          limit={"6"}
          brandName={"Patek Philippe"}
        />
      </Suspense>
      <TrustedSeller />
      <VipDiscount />
      <Disclaimer />
    </>
  );
}
