import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/homepage/footer";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Luxury Level – Premium Watches, Jewelry, and Designer Bags",
  description:
    "Discover timeless luxury at Luxury Level. Shop authentic watches, fine jewelry, and designer bags from Kuwait’s premier retailer, located in Al Zumorrodah Tower.",
  keywords: [
    "Luxury watches Kuwait",
    "Designer bags Kuwait",
    "Jewelry store Kuwait",
    "Rolex Kuwait",
    "Luxury Level",
    "Al Zumorrodah tower",
    "Patek Philippe",
    "Authentic luxury items",
  ],
  authors: [
    { name: "Luxury Level", url: `${process.env.NEXT_PUBLIC_FRONTEND_URL!}` },
  ],
  creator: "Luxury Level",
  publisher: "Luxury Level",
  applicationName: "Luxury Level Online Store",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Luxury Level – Premium Watches, Jewelry, and Designer Bags",
    description:
      "Explore Kuwait’s trusted source for authentic luxury goods. Rolex, Patek Philippe, Cartier, Chanel, and more.",
    url: `${process.env.NEXT_PUBLIC_FRONTEND_URL!}`,
    siteName: "Luxury Level",
    type: "website",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_FRONTEND_URL!}/banners/watches`, // replace with actual
        width: 1200,
        height: 630,
        alt: "Luxury Level – Elegant watches and accessories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxury Level – Premium Watches, Jewelry, and Designer Bags",
    description:
      "Shop authentic luxury timepieces, fine jewelry, and designer handbags from Kuwait’s premier luxury store.",
    images: [`${process.env.NEXT_PUBLIC_FRONTEND_URL!}/banners/watches`], // replace with actual
    creator: "@LuxuryLevel", // optional: your Twitter handle
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL!),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let brandsMenu = { brands: [] };
  let jewelryMenu = [];
  let bagsMenu = [];

  try {
    const [brandsRes, jewelryRes, bagsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands`, { method: "GET" }),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/categories/jewelry/sub-categories`,
        {
          method: "GET",
        }
      ),
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/categories/bags/available-brands`,
        {
          method: "GET",
        }
      ),
    ]);

    if (!brandsRes.ok || !jewelryRes.ok || !bagsRes.ok) {
      throw new Error(
        `API fetch failed: brands=${brandsRes.status}, jewelry=${jewelryRes.status}, bags=${bagsRes.status}`
      );
    }

    [brandsMenu, jewelryMenu, bagsMenu] = await Promise.all([
      brandsRes.json(),
      jewelryRes.json(),
      bagsRes.json(),
    ]);
  } catch (error) {
    console.error("Fetch error in RootLayout:", error);
  }

  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <Navbar
          brandsMenu={brandsMenu.brands}
          jewelryMenu={jewelryMenu}
          bagsMenu={bagsMenu}
        />
        {children}
        <Footer />
      </body>
    </html>
  );
}
