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
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxury Watches | Rolex, Patek Philippe, and More | Timepiece Hub",
  description:
    "Explore our curated collection of luxury watches from top brands like Rolex and Patek Philippe. Trusted sellers, VIP discounts, and fast delivery.",
  openGraph: {
    title: "Luxury Watches | Rolex, Patek Philippe, and More | Timepiece Hub",
    description:
      "Discover timeless elegance with our premium selection of watches. Shop now for exclusive deals on luxury timepieces.",
    url: process.env.NEXT_PUBLIC_FRONTEND_URL, // Replace with your real site URL
    siteName: "Timepiece Hub",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/banners/watches`, // Replace with your image
        width: 1200,
        height: 630,
        alt: "Luxury Watches Collection",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Watches | Rolex, Patek Philippe, and More | Timepiece Hub",
    description:
      "Shop exclusive luxury timepieces. Trusted sellers and great discounts.",
    images: [`${process.env.NEXT_PUBLIC_FRONTEND_URL}/banners/watches`], // Same image
  },
};

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
