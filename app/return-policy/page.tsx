import Banner from "@/components/banner";
import ReturnPolicy from "@/components/policypages/returnpolicy";
import { Metadata } from "next";

// SEO Metadata
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "https://luxurylevel.com";

  return {
    title: "Return Policy | Luxury Level",
    description:
      "Review the official return and exchange policy at Luxury Level. Shop confidently with our clear and customer-friendly return guidelines.",
    keywords: [
      "Luxury Level return policy",
      "returns and exchanges",
      "refund policy",
      "luxury fashion returns",
      "customer service",
      "Luxury Level policies",
    ],
    openGraph: {
      title: "Luxury Level Return & Exchange Policy",
      description:
        "Explore our hassle-free return policy designed to ensure a smooth experience for every Luxury Level customer.",
      url: `${baseUrl}/return-policy`,
      images: [
        {
          url: `${baseUrl}/banners/watches`, // Add extension like .webp if needed
          alt: "Return Policy Banner - Luxury Level",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Return Policy | Luxury Level",
      description:
        "Understand how returns and exchanges work at Luxury Level. Your satisfaction is our priority.",
      images: [`${baseUrl}/banners/watches`],
    },
  };
}

export default async function Page() {
  return (
    <>
      <Banner title={"RETURN POLICY"} classnameForBgSrc={"/banners/watches"} />
      <ReturnPolicy />
    </>
  );
}
