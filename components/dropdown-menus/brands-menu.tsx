"use client";

import { Brand } from "@/lib/types";
import { Poppins } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Load Poppins font with a CSS variable
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function OurBrandsMenu({
  toggleMobileNav,
}: {
  toggleMobileNav?: () => void;
}) {
  const [brands, setbrands] = useState<Brand[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchBrands = async () => {
      const res = await fetch(`/api/brands`, {
        method: "GET",
      });
      const brands = await res.json();
      const _brands: Brand[] = brands.brands;

      setbrands(_brands);
    };

    fetchBrands();
  }, []);

  const redirect = (brand: Brand) => {
    if (toggleMobileNav) {
      toggleMobileNav();
    }
    //set banner title through local storage
    localStorage.setItem("banner-title", brand.name);
    router.push(`/brands/${brand.id}`);
  };

  return (
    <div
      className={`grid  grid-cols-1 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${poppins.className} p-4 bg-white `}
    >
      {brands.map((brand) => {
        if (!brand.name) return null;

        return (
          <button
            key={brand.id}
            onClick={() => redirect(brand)}
            className={`font-normal pr-2 lg:text-[12px] xl:text-[14px] text-start 
               border-r-[1px] border-gray-300`}
          >
            {brand.name}
          </button>
        );
      })}
    </div>
  );
}
