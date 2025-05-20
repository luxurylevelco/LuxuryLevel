"use client";

import { Brand } from "@/lib/types";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function OurBrandsMenu() {
  const [brands, setbrands] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const res = await fetch(`/api/brands`, {
        method: "GET",
        cache: "force-cache",
      });
      const brands = await res.json();
      const _brands: Brand[] = brands.brands;

      setbrands(_brands);
    };

    fetchBrands();
  }, []);

  const columns = 6;

  return (
    <div
      className={`grid  grid-cols-1 lg:grid-cols-6 gap-4 ${poppins.className} p-4 `}
    >
      {brands.map((brand, index) => {
        const isLastColumn = (index + 1) % columns === 0;

        if (!brand.name) return null;

        return (
          <Link
            key={brand.id}
            href={`/brands/${brand.id}`}
            className={`font-normal pr-4 text-[14px] ${
              !isLastColumn ? "border-r-[1px] border-gray-300" : ""
            }`}
          >
            {brand.name}
          </Link>
        );
      })}
    </div>
  );
}
