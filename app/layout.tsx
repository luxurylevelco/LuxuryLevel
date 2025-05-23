import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/homepage/footer";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // optional: customize as needed
});

export const metadata: Metadata = {
  title: "Luxury Level",
  description:
    "Luxury Level a shop for jewelry and luxury watches based on Kuwait City, Kuwait  ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [brandsRes, jewelryRes, bagsRes] = await Promise.all([
    fetch(`${process.env.API_URL}/api/brands`, {
      method: "GET",
    }),
    fetch(`${process.env.API_URL}/api/categories/jewelry/sub-categories`, {
      method: "GET",
    }),
    fetch(`${process.env.API_URL}/api/categories/bags/available-brands`, {
      method: "GET",
    }),
  ]);

  const [brandsMenu, jewelryMenu, bagsMenu] = await Promise.all([
    brandsRes.json(),
    jewelryRes.json(),
    bagsRes.json(),
  ]);

  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased `}>
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
