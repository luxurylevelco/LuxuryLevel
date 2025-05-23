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
  title: "Luxury Level",
  description:
    "Luxury Level a shop for jewelry and luxury watches based on Kuwait City, Kuwait",
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
      fetch(`${process.env.API_URL}/api/brands`, { method: "GET" }),
      fetch(`${process.env.API_URL}/api/categories/jewelry/sub-categories`, {
        method: "GET",
      }),
      fetch(`${process.env.API_URL}/api/categories/bags/available-brands`, {
        method: "GET",
      }),
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
