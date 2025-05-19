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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased `}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
