import Banner from "@/components/banner";
import CompanyOverviewExt from "@/components/about-us-ext/company-overview-ext";
import Disclaimer from "@/components/about-us-ext/disclaimer";
import OtherInfo from "@/components/about-us-ext/other-info";
import CollectionInfo from "@/components/about-us-ext/collection-info";
import LimitedEdition from "@/components/about-us-ext/limited-edition";
import { Metadata } from "next";

// SEO Metadata
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "https://luxurylevel.com";

  return {
    title: "About Luxury Level | Company Overview & Philosophy",
    description:
      "Learn about Luxury Level — our heritage, values, and commitment to delivering timeless luxury collections to discerning customers.",
    keywords: [
      "Luxury Level",
      "about us",
      "company overview",
      "luxury brand story",
      "craftsmanship",
      "high-end fashion",
      "luxury collections",
    ],
    openGraph: {
      title: "Discover the World of Luxury Level",
      description:
        "Explore the company philosophy and background behind Luxury Level. Designed for connoisseurs of elegance and exclusivity.",
      url: `${baseUrl}/about/company-overview`,
      images: [
        {
          url: `${baseUrl}/banners/jewelry`, // you may want to add `.webp` or `.jpg`
          alt: "Luxury Level Company Overview Banner",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "About Luxury Level | Our Philosophy & Story",
      description:
        "Dive into the world of Luxury Level and discover our heritage, values, and luxury craftsmanship.",
      images: [`${baseUrl}/banners/jewelry`],
    },
  };
}

export default async function Page() {
  return (
    <>
      <Banner
        title={"COMPANY OVERVIEW"}
        classnameForBgSrc={"/banners/jewelry"}
      />
      <CompanyOverviewExt />
      <Disclaimer />
      <OtherInfo />
      <CollectionInfo />
      <LimitedEdition />
    </>
  );
}
